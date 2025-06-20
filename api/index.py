import os
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pandas as pd
import re
import traceback

app = Flask(__name__, static_url_path='/static')
CORS(app)

# --- 2つのExcelファイルを読み込み (ファイル名を更新) ---
df_chart = None
df_ex = None
try:
    # header=None を指定して、1行目からデータとして読み込む
    chart_file_path = os.path.join(os.path.dirname(__file__), 'aochart.xlsx')
    df_chart = pd.read_excel(chart_file_path, dtype=str, header=None)
    print("Chart Excel file loaded successfully")
except FileNotFoundError as e:
    print(f"Chart file not found: {e}")

try:
    # header=None を指定
    ex_file_path = os.path.join(os.path.dirname(__file__), 'aochart_ex.xlsx')
    df_ex = pd.read_excel(ex_file_path, dtype=str, header=None)
    print("Exercise Excel file loaded successfully")
except FileNotFoundError as e:
    print(f"Exercise file not found: {e}")

def process_latex_text(problem_text):
    """
    ラッピング済みのテキストに対して、最終的な微調整と、
    過去に見つかった特定のデータエラーの修復のみを行う。
    """
    if not isinstance(problem_text, str): return ""
    
    # ドル記号のデリミタをバックスラッシュ形式に統一
    text = re.sub(r'\$\$(.*?)\$\$', r'\\\[\1\\\]', problem_text, flags=re.DOTALL)
    text = re.sub(r'\$([^$]*?)\$', r'\\(\1\\)', text)
    
    # 二重ラップを解消
    while r'\(\(' in text and r'\)\)' in text:
        text = text.replace(r'\(\(', r'\(')
        text = text.replace(r'\)\)', r'\)')

    # デリミタ周りの一貫しないスペースを正規化（削除）
    text = text.replace(r'\ (', r'\(')
    text = text.replace(r'\ )', r'\)')
    text = text.replace(r'\ [', r'\[')
    text = text.replace(r'\ ]', r'\]')

    # 読点とカンマの処理
    text = text.replace('、', ',')
    text = re.sub(r',(?!\s)', r', ', text)

    # データソース内の特定の記述ミスを修正する処理
    text = text.replace('＾', '^')
    text = text.replace(r'\left\)', r'\left(')
    text = text.replace(r'\right\(', r'\right)')
    text = re.sub(r'f\\\)\s*\((\d+)\)\\\(', r'f(\1)', text)
    
    # 数式デリミタの前後に必要に応じてスペースを挿入する
    text = re.sub(r'(?<!\s)(\\[\(\[])', r' \1', text)
    text = re.sub(r'(\\[\)\]])(?!\s)', r'\1 ', text)
    
    return text

class ProblemFormatter:
    """
    問題文をHTML形式に整形するクラス。
    - 小問番号での改行
    - 複数種類の小問番号でのインデント
    - 分数の表示スタイル調整
    """
    def __init__(self):
        # 小問番号を認識する正規表現
        self.item_pattern = re.compile(
            r'(?<![a-zA-Z_0-9\(])'
            r'('
            r'([①-⑳])|(\((?:[1-9]|1[0-9]|20)\)(?!の|は|が|で|と|より|から|の値))|(\([ア-コ]\))'
            r')'
        )
        # MathJaxのデリミタで区切るための正規表現
        self.math_pattern = re.compile(r'(\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\$\$.*?\$\$)', re.DOTALL)
        self.series_types_found = []

    def _replacer(self, match):
        full_match = match.group(1)
        current_series_type = None
        if match.group(2): current_series_type = 'round_num'
        elif match.group(3): current_series_type = 'paren_num'
        elif match.group(4): current_series_type = 'paren_kana'
        if current_series_type and current_series_type not in self.series_types_found:
            self.series_types_found.append(current_series_type)
        indent = ''
        if current_series_type and self.series_types_found.index(current_series_type) >= 1:
            indent = '&emsp;'
        return f"</p><p>{indent}{full_match}"

    def _format_text_part(self, text_part):
        # 地の文に小問番号の改行処理を適用
        return self.item_pattern.sub(self._replacer, text_part)

    def _format_fractions(self, math_part):
        # トップレベルの\fracを\dfracに置換する
        delimiters = None
        if math_part.startswith(r'\[') and math_part.endswith(r'\]'): delimiters = (r'\[', r'\]')
        elif math_part.startswith(r'\(') and math_part.endswith(r'\)'): delimiters = (r'\(', r'\)')
        elif math_part.startswith('$$') and math_part.endswith('$$'): delimiters = ('$$', '$$')
        elif math_part.startswith('$') and math_part.endswith('$'): delimiters = ('$', '$')
        else: return math_part
        content = math_part[len(delimiters[0]):-len(delimiters[1])]
        output_str = ""
        i = 0
        brace_level = 0
        while i < len(content):
            if content[i:i+5] == '\\frac':
                if brace_level == 0: output_str += '\\dfrac'
                else: output_str += '\\frac'
                i += 5
            elif content[i] == '{':
                if i > 0 and content[i-1] != '\\': brace_level += 1
                elif i == 0: brace_level += 1
                output_str += content[i]
                i += 1
            elif content[i] == '}':
                if i > 0 and content[i-1] != '\\': brace_level = max(0, brace_level - 1)
                elif i == 0: brace_level = max(0, brace_level - 1)
                output_str += content[i]
                i += 1
            else:
                output_str += content[i]
                i += 1
        return delimiters[0] + output_str + delimiters[1]

    def format(self, text):
        if not isinstance(text, str) or not text.strip(): return ""
        self.series_types_found = []
        # 数式と地の文を分離
        parts = self.math_pattern.split(text)
        formatted_parts = []
        for i, part in enumerate(parts):
            if i % 2 == 0:
                # 地の文をフォーマット
                formatted_parts.append(self._format_text_part(part))
            else:
                # 数式をフォーマット
                formatted_parts.append(self._format_fractions(part))
        formatted_text = "".join(formatted_parts)
        # 全体をpタグで囲む
        final_html = f"<p>{formatted_text}</p>"
        if final_html.startswith("<p></p>"):
            final_html = final_html[len("<p></p>"):]
        final_html = re.sub(r'(<p>\s*</p>)+', '', final_html)
        return final_html

problem_formatter = ProblemFormatter()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_problem', methods=['POST'])
def get_problem():
    try:
        if not request.is_json: return jsonify(error="リクエストの形式が不正です。"), 400
        data = request.get_json()
        if not data: return jsonify(error="リクエストボディが空です。"), 400
        
        selected_book = data.get('book', 'all')
        selected_units = data.get('units', [])
        raw_difficulties = data.get('difficulties', [])
        selected_difficulties = [int(d) for d in raw_difficulties if isinstance(d, (int, str)) and str(d).isdigit()]

        if not selected_units or not selected_difficulties:
            return jsonify(error="単元と難易度を少なくとも1つずつ選択してください。")
        
        df_list = []
        if selected_book in ['all', 'chart'] and df_chart is not None:
            temp_chart = df_chart.copy()
            temp_chart['source'] = 'chart'
            df_list.append(temp_chart)
        if selected_book in ['all', 'ex'] and df_ex is not None:
            temp_ex = df_ex.copy()
            temp_ex['source'] = 'ex'
            df_list.append(temp_ex)

        if not df_list:
            return jsonify(error="選択可能な問題集のデータが見つかりません。")
        
        target_df = pd.concat(df_list, ignore_index=True)

        # 列の名前の代わりにインデックス番号でアクセス
        target_df[2] = pd.to_numeric(target_df[2], errors='coerce').fillna(0).astype(int)
        matching_rows = target_df[
            (target_df[1].isin(selected_units)) &
            (target_df[2].isin(selected_difficulties))
        ]
        if matching_rows.empty:
            return jsonify(error="選択した単元と難易度に合致する問題が見つかりません。")

        random_row = matching_rows.sample(n=1).iloc[0]
        
        unit_name = random_row.iloc[1]
        example_number = random_row.iloc[3]
        
        if 'source' in random_row and random_row['source'] == 'ex':
            problem_number_display = f"EXERCISE {example_number}"
        else:
            problem_number_display = str(example_number)

        # 5列目からデータを読み込む
        raw_problem_text = process_latex_text(random_row.iloc[4])
        formatted_equation = problem_formatter.format(raw_problem_text)
        
        image_flag = int(random_row.iloc[5]) if pd.notna(random_row.iloc[5]) else 0
        image_number = int(random_row.iloc[6]) if pd.notna(random_row.iloc[6]) else None
        difficulty = int(random_row.iloc[2]) if pd.notna(random_row.iloc[2]) else 0
        
        return jsonify(
            unit_name=unit_name,
            problem_number=problem_number_display,
            equation=formatted_equation,
            image_flag=image_flag,
            image_number=image_number,
            difficulty=difficulty
        )
    except Exception as e:
        app.logger.error(f"Error in /get_problem: {e}\n{traceback.format_exc()}")
        return jsonify(error="サーバー側で予期せぬエラーが発生しました。", details=str(e)), 500

@app.route('/get_selected_problem')
def get_selected_problem():
    try:
        if df_chart is None: return jsonify(error="問題データ(chart)が読み込まれていません。")
        selected_unit = request.args.get('unit')
        problem_number = request.args.get('problem_number')
        if not selected_unit or not problem_number: return jsonify(error="単元と問題番号が指定されていません。")
        
        # 列の名前の代わりにインデックス番号でアクセス
        df_chart[3] = df_chart[3].astype(str)
        problem_number = str(problem_number)
        row = df_chart[(df_chart[1] == selected_unit) & (df_chart[3] == problem_number)]
        
        if row.empty: return jsonify(error=f"問題が見つかりません: {selected_unit} - {problem_number}")
        row = row.iloc[0]
        # 5列目からデータを読み込む
        raw_latex_data = process_latex_text(row.iloc[4])
        formatted_equation = problem_formatter.format(raw_latex_data)
        image_flag = int(row.iloc[5]) if pd.notna(row.iloc[5]) else 0
        image_number = int(row.iloc[6]) if pd.notna(row.iloc[6]) else None
        difficulty = int(row.iloc[2]) if pd.notna(row.iloc[2]) else 0
        return jsonify(problem_number=problem_number, equation=formatted_equation, difficulty=difficulty, image_flag=image_flag, image_number=image_number, row_number=int(row.name))
    except Exception as e:
        app.logger.error(f"Error in /get_selected_problem: {e}\n{traceback.format_exc()}")
        return jsonify(error="サーバー側で予期せぬエラーが発生しました。", details=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
