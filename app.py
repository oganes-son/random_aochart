import os
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__, static_url_path='/static')
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

@app.route('/get_problem', methods=['POST'])
def get_problem():
    try:
        data = request.get_json()
        selected_units = data.get('units', [])
        selected_difficulties = [int(difficulty) for difficulty in data.get('difficulties', [])]

        matching_rows = df[(df.iloc[:, 1].isin(selected_units)) & (df.iloc[:, 2].isin(selected_difficulties))]
        
        if matching_rows.empty:
            return jsonify(error="No problems found for the selected units and difficulties.")
        
        random_row = matching_rows.sample(n=1).iloc[0]

        problem_number = int(random_row.iloc[3])
        latex_data = random_row.iloc[4]
        q1 = "" if pd.isna(random_row.iloc[5]) else random_row.iloc[5]
        q2 = "" if pd.isna(random_row.iloc[6]) else random_row.iloc[6]
        q3 = "" if pd.isna(random_row.iloc[7]) else random_row.iloc[7]
        q4 = "" if pd.isna(random_row.iloc[8]) else random_row.iloc[8]
        q5 = "" if pd.isna(random_row.iloc[9]) else random_row.iloc[9]
        q6 = "" if pd.isna(random_row.iloc[10]) else random_row.iloc[10]
        image_flag = int(random_row.iloc[11])
        image_number = int(random_row.iloc[12]) if pd.notna(random_row.iloc[12]) else None

        return jsonify(
            problem_number=int(problem_number),
            equation=latex_data, 
            q1=q1, q2=q2, q3=q3, q4=q4, q5=q5, q6=q6,
            image_flag=int(image_flag),
            image_number=image_number,
            row_number=int(random_row.name)
        )
    except Exception as e:
        return jsonify(error=str(e))

@app.route('/get_selected_problem')
def get_selected_problem():
    try:
        selected_unit = request.args.get('unit')
        problem_number = int(request.args.get('problem_number'))

        row = df[(df.iloc[:, 1] == selected_unit) & (df.iloc[:, 3] == problem_number)]
        
        if row.empty:
            return jsonify(problem_number=problem_number, equation="", q1="", q2="", q3="", q4="", q5="", q6="", difficulty="", image_flag=0)

        latex_data = row.iloc[0, 4]
        q1 = "" if pd.isna(row.iloc[0, 5]) else row.iloc[0, 5]
        q2 = "" if pd.isna(row.iloc[0, 6]) else row.iloc[0, 6]
        q3 = "" if pd.isna(row.iloc[0, 7]) else row.iloc[0, 7]
        q4 = "" if pd.isna(row.iloc[0, 8]) else row.iloc[0, 8]
        q5 = "" if pd.isna(row.iloc[0, 9]) else row.iloc[0, 9]
        q6 = "" if pd.isna(row.iloc[0, 10]) else row.iloc[0, 10]
        difficulty = int(row.iloc[0, 2])
        image_flag = int(row.iloc[0, 11])
        image_number = int(row.iloc[0, 12]) if pd.notna(row.iloc[0, 12]) else None

        return jsonify(
            problem_number=int(problem_number),
            equation=latex_data,
            q1=q1,
            q2=q2,
            q3=q3,
            q4=q4,
            q5=q5,
            q6=q6,
            difficulty=int(difficulty),
            image_flag=int(image_flag),
            image_number=image_number,
            row_number=int(row.index[0]) # int型に変換
        )
    except Exception as e:
        return jsonify(error=str(e))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
