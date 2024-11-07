import os
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # CORSを有効にする

# エクセルファイルを読み込む
file_path = os.path.join(os.path.dirname(__file__), 'aochart_LaTeX_data.xlsx')

try:
    df = pd.read_excel(file_path)
    print("Excel file loaded successfully")
except FileNotFoundError as e:
    print(f"File not found: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/units.html')
def serve_units():
    return render_template('units.html')

@app.route('/get_problem', methods=['POST'])
def get_problem():
    try:
        data = request.get_json()
        selected_units = data.get('units', [])
        selected_difficulties = [int(difficulty) for difficulty in data.get('difficulties', [])]
        
        print(f"Selected units: {selected_units}")
        print(f"Selected difficulties: {selected_difficulties}")
        
        # デバッグ用にデータの先頭を表示
        print("DataFrame head:")
        print(df.head())

        # 選択された単元および難易度の行をすべて取得
        matching_rows = df[(df.iloc[:, 1].isin(selected_units)) & (df.iloc[:, 2].isin(selected_difficulties))]
        
        if matching_rows.empty:
            print("No matching rows found")
            return jsonify(error="No problems found for the selected units and difficulties.")
        
        print(f"Matching rows: {matching_rows.shape[0]}")
        
        # ランダムに行を選択
        random_row = matching_rows.sample(n=1).iloc[0]
        
        problem_number = int(random_row.iloc[3])  # int 型に変換
        latex_data = random_row.iloc[4]
        q1 = random_row.iloc[5]
        q2 = random_row.iloc[6]
        q3 = random_row.iloc[7]
        q4 = random_row.iloc[8]
        q5 = random_row.iloc[9]
        q6 = random_row.iloc[10]
        
        print(f"Selected problem: {problem_number}, {latex_data}, {q1}, {q2}, {q3}, {q4}, {q5}, {q6}")
        
        # 空白値をチェックして、空白のままにする
        q1 = "" if pd.isna(q1) else q1
        q2 = "" if pd.isna(q2) else q2
        q3 = "" if pd.isna(q3) else q3
        q4 = "" if pd.isna(q4) else q4
        q5 = "" if pd.isna(q5) else q5
        q6 = "" if pd.isna(q6) else q6
        
        return jsonify(problem_number=problem_number, equation=latex_data, q1=q1, q2=q2, q3=q3, q4=q4, q5=q5, q6=q6)
    except IndexError as e:
        print('IndexError:', str(e))  # エラーをログに出力
        return jsonify(error="Index out-of-bounds error.")
    except Exception as e:
        print('Error:', str(e))  # エラーをログに出力
        return jsonify(error=str(e))

@app.route('/get_selected_problem')
def get_selected_problem():
    try:
        selected_unit = request.args.get('unit')
        problem_number = int(request.args.get('problem_number'))
        
        row = df[(df.iloc[:, 1] == selected_unit) & (df.iloc[:, 3] == problem_number)]
        
        if row.empty:
            return jsonify(problem_number=problem_number, equation="", q1="", q2="", q3="", q4="", q5="", q6="", difficulty="")
        
        latex_data = row.iloc[0, 4]
        q1 = row.iloc[0, 5]
        q2 = row.iloc[0, 6]
        q3 = row.iloc[0, 7]
        q4 = row.iloc[0, 8]
        q5 = row.iloc[0, 9]
        q6 = row.iloc[0, 10]
        difficulty = row.iloc[0, 2]  # 難易度を取得
        
        q1 = "" if pd.isna(q1) else q1
        q2 = "" if pd.isna(q2) else q2
        q3 = "" if pd.isna(q3) else q3
        q4 = "" if pd.isna(q4) else q4
        q5 = "" if pd.isna(q5) else q5
        q6 = "" if pd.isna(q6) else q6

        return jsonify(
            problem_number=problem_number,
            equation=latex_data,
            q1=q1,
            q2=q2,
            q3=q3,
            q4=q4,
            q5=q5,
            q6=q6,
            difficulty=difficulty  # 難易度を返す
        )
    except Exception as e:
        return jsonify(error=str(e))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
