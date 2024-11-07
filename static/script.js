document.addEventListener("DOMContentLoaded", function() {
    if (typeof MathJax !== 'undefined' && MathJax.startup) {
        MathJax.startup.promise.then(() => {
            MathJax.typesetPromise();
        });
    }

    // パスワードチェック関数
    const correctPassword = "math"; // ここに設定したいパスワードを入力
    function checkPassword() {
        const inputPassword = document.getElementById('password').value;
        const loginElement = document.getElementById('login');
        const contentElement = document.getElementById('content');
        if (inputPassword === correctPassword) {
            if (loginElement && contentElement) {
                loginElement.style.display = 'none';
                contentElement.style.display = 'block';
            }
        } else {
            alert('パスワードが間違っています');
        }
    }
    window.checkPassword = checkPassword; // これを追加して、グローバル関数にする

    // LaTeXをラップする関数
    function wrapLatex(text) {
        if (!text) return "";
        return text.replace(/([^\u3000-\u303F\u3040-\u30FF\u4E00-\u9FFF]+)/g, function(match) {
            return `\\(${match}\\)`;
        });
    }
    
    // 問題を取得する関数
    function getProblem() {
        const selectedUnits = [];
        const selectedDifficulties = [];

        // 選択された単元を収集
        document.querySelectorAll('.unit-checkbox:checked').forEach(checkbox => {
            selectedUnits.push(checkbox.parentElement.textContent.trim());
        });
        // 選択された難易度を収集 
        document.querySelectorAll('#difficult .unit-checkbox:checked').forEach(checkbox => { 
            selectedDifficulties.push(checkbox.getAttribute('data-difficulty')); 
        });

        if (selectedUnits.length === 0) {
            document.getElementById('error-message').style.display = 'block';
            return;
        } else {
            document.getElementById('error-message').style.display = 'none';
        }

        fetch('/get_problem', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ units: selectedUnits, difficulties: selectedDifficulties })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Server error: ' + data.error);
                return;
            }
            const problemNumberElement = document.getElementById('problem_number');
            const equationContainer = document.getElementById('equation_container');
            const question1 = document.getElementById('question1');
            const question2 = document.getElementById('question2');
            const question3 = document.getElementById('question3');
            const question4 = document.getElementById('question4');
            const question5 = document.getElementById('question5');
            const question6 = document.getElementById('question6');
            if (problemNumberElement && equationContainer && question1 && question2 && question3 && question4 && question5 && question6) {
                problemNumberElement.innerText = data.problem_number;
                equationContainer.innerHTML = wrapLatex(data.equation);
                question1.innerHTML = wrapLatex(data.q1);
                question2.innerHTML = wrapLatex(data.q2);
                question3.innerHTML = wrapLatex(data.q3);
                question4.innerHTML = wrapLatex(data.q4);
                question5.innerHTML = wrapLatex(data.q5);
                question6.innerHTML = wrapLatex(data.q6);
                MathJax.typesetPromise([
                    equationContainer, 
                    question1, 
                    question2, 
                    question3, 
                    question4,
                    question5,
                    question6
                ]);
            }
        })
        .catch(error => {
            alert('There was an error fetching the problem. Please try again later.');
        });
    }
    window.getProblem = getProblem; // これを追加して、グローバル関数にする

    // 問題を取得する関数
    function getSelectedProblem() {
        const unit = document.getElementById('unit_select').value;
        const problemNumber = document.getElementById('problem_number_input').value;

        fetch(`/get_selected_problem?unit=${unit}&problem_number=${problemNumber}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }

                const selectedProblemNumberElement = document.getElementById('selected_problem_number');
                const selectedEquationContainer = document.getElementById('selected_equation_container');
                const selectedQuestion1 = document.getElementById('selected_question1');
                const selectedQuestion2 = document.getElementById('selected_question2');
                const selectedQuestion3 = document.getElementById('selected_question3');
                const selectedQuestion4 = document.getElementById('selected_question4');
                const selectedQuestion5 = document.getElementById('selected_question5');
                const selectedQuestion6 = document.getElementById('selected_question6');
                const difficultyLevelElement = document.getElementById('difficulty_level');

                if (selectedProblemNumberElement && selectedEquationContainer && selectedQuestion1 && selectedQuestion2 && selectedQuestion3 && selectedQuestion4 && selectedQuestion5 && selectedQuestion6 && difficultyLevelElement) {
                    selectedProblemNumberElement.innerText = data.problem_number;
                    selectedEquationContainer.innerHTML = wrapLatex(data.equation);
                    selectedQuestion1.innerHTML = wrapLatex(data.q1);
                    selectedQuestion2.innerHTML = wrapLatex(data.q2);
                    selectedQuestion3.innerHTML = wrapLatex(data.q3);
                    selectedQuestion4.innerHTML = wrapLatex(data.q4);
                    selectedQuestion5.innerHTML = wrapLatex(data.q5);
                    selectedQuestion6.innerHTML = wrapLatex(data.q6);

                    // 難易度を☆で表示
                    let stars = "";
                    switch (parseInt(data.difficulty)) {
                        case 1:
                            stars = "★☆☆☆☆"; break;
                        case 2:
                            stars = "★★☆☆☆"; break;
                        case 3:
                            stars = "★★★☆☆"; break;
                        case 4:
                            stars = "★★★★☆"; break;
                        case 5:
                            stars = "★★★★★"; break;
                        default:
                            stars = "難易度不明";
                    }
                    difficultyLevelElement.innerText = stars;

                    MathJax.typesetPromise([
                        selectedEquationContainer, 
                        selectedQuestion1, 
                        selectedQuestion2, 
                        selectedQuestion3, 
                        selectedQuestion4,
                        selectedQuestion5,
                        selectedQuestion6
                    ]);
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }
    window.getSelectedProblem = getSelectedProblem;


    // 親スイッチが子スイッチと連動するように設定
    document.querySelectorAll('.unit-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const target = this.getAttribute('data-target');
            const checkboxes = document.querySelectorAll(`#${target} .unit-checkbox`);
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked; // 親のトグルスイッチの状態に合わせて子のトグルスイッチを変更
            });
        });
    });

    // アコーディオンの開閉を行うイベントリスナー
    document.querySelectorAll('.accordion .arrow-wrapper').forEach(arrow => {
        arrow.addEventListener('click', function() {
            const content = this.parentElement.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
            content.classList.toggle('content-open');
            this.querySelector('.fa').classList.toggle('fa-rotate-180');
        });
    });

    // トグルスイッチの状態を確認するためにイベントリスナーを追加
    document.querySelectorAll('.unit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('Checkbox changed:', this.checked);
        });
    });
});

