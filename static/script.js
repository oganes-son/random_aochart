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
        document.querySelectorAll('.unit-checkbox:checked').forEach(checkbox => {
            selectedUnits.push(checkbox.parentElement.textContent.trim());
        });
        console.log('Selected units:', selectedUnits); // 選択された単元をログに出力
        if (selectedUnits.length === 0) {
            document.getElementById('error-message').style.display = 'block';
            return;
        } else {
            document.getElementById('error-message').style.display = 'none';
        }
        fetch('/get_problem', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ units: selectedUnits })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response data:', data); // サーバーからのレスポンスをログに出力
            if (data.error) {
                console.error('Error from server:', data.error); // サーバーからのエラー内容をログに出力
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
            console.error('Fetch error:', error); // フェッチエラーをログに出力
            alert('There was an error fetching the problem. Please try again later.');
        });
    }
    window.getProblem = getProblem; // これを追加して、グローバル関数にする

    // 選択された問題を取得する関数
    function getSelectedProblem() {
        const unit = document.getElementById('unit_select').value;
        const problemNumber = document.getElementById('problem_number_input').value;
        fetch(`/get_selected_problem?unit=${unit}&problem_number=${problemNumber}`)
            .then(response => response.json())
            .then(data => {
                console.log('Response data:', data); // デバッグ用ログ

                if (data.error) {
                    throw new Error(data.error);
                }

                const checkEmpty = (value) => (value === "" || value === "nan" || value === undefined || value === null || value === NaN) ? "" : value;

                const selectedProblemNumberElement = document.getElementById('selected_problem_number');
                const selectedEquationContainer = document.getElementById('selected_equation_container');
                const selectedQuestion1 = document.getElementById('selected_question1');
                const selectedQuestion2 = document.getElementById('selected_question2');
                const selectedQuestion3 = document.getElementById('selected_question3');
                const selectedQuestion4 = document.getElementById('selected_question4');
                const selectedQuestion5 = document.getElementById('selected_question5');
                const selectedQuestion6 = document.getElementById('selected_question6');

                if (selectedProblemNumberElement && selectedEquationContainer && selectedQuestion1 && selectedQuestion2 && selectedQuestion3 && selectedQuestion4 && selectedQuestion5 && selectedQuestion6) {
                    console.log('Updating elements with data...');
                    console.log('selectedProblemNumberElement:', selectedProblemNumberElement);
                    console.log('selectedEquationContainer:', selectedEquationContainer);
                    console.log('selectedQuestion1:', selectedQuestion1);
                    console.log('selectedQuestion2:', selectedQuestion2);
                    console.log('selectedQuestion3:', selectedQuestion3);
                    console.log('selectedQuestion4:', selectedQuestion4);
                    console.log('selectedQuestion5:', selectedQuestion5);
                    console.log('selectedQuestion6:', selectedQuestion6);

                    selectedProblemNumberElement.innerText = checkEmpty(data.problem_number);
                    selectedEquationContainer.innerHTML = wrapLatex(checkEmpty(data.equation));
                    selectedQuestion1.innerHTML = wrapLatex(checkEmpty(data.q1));
                    selectedQuestion2.innerHTML = wrapLatex(checkEmpty(data.q2));
                    selectedQuestion3.innerHTML = wrapLatex(checkEmpty(data.q3));
                    selectedQuestion4.innerHTML = wrapLatex(checkEmpty(data.q4));
                    selectedQuestion5.innerHTML = wrapLatex(checkEmpty(data.q5));
                    selectedQuestion6.innerHTML = wrapLatex(checkEmpty(data.q6));

                    console.log('selectedEquationContainer.innerHTML:', selectedEquationContainer.innerHTML);
                    console.log('selectedQuestion1.innerHTML:', selectedQuestion1.innerHTML);
                    console.log('selectedQuestion2.innerHTML:', selectedQuestion2.innerHTML);
                    console.log('selectedQuestion3.innerHTML:', selectedQuestion3.innerHTML);
                    console.log('selectedQuestion4.innerHTML:', selectedQuestion4.innerHTML);
                    console.log('selectedQuestion5.innerHTML:', selectedQuestion5.innerHTML);
                    console.log('selectedQuestion6.innerHTML:', selectedQuestion6.innerHTML);

                    MathJax.typesetPromise([
                        selectedEquationContainer, 
                        selectedQuestion1, 
                        selectedQuestion2, 
                        selectedQuestion3, 
                        selectedQuestion4,
                        selectedQuestion5,
                        selectedQuestion6
                    ]).then(() => {
                        console.log('MathJax rendering complete');
                    }).catch((err) => {
                        console.error('MathJax rendering error:', err);
                    });
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }
    window.getSelectedProblem = getSelectedProblem;

    document.querySelectorAll('.accordion .title').forEach(title => {
        title.addEventListener('click', function() {
            const content = title.nextElementSibling;
            debugger; // デバッガステートメントを追加
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
            content.classList.toggle('content-open');
            title.querySelector('.fa').classList.toggle('fa-rotate-180');
            console.log('Accordion toggle:', content.classList.contains('content-open')); // デバッグ用ログ
        });
    });

    // トグルスイッチの状態を確認するためにイベントリスナーを追加
    document.querySelectorAll('.unit-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('Checkbox changed:', this.checked);
        });
    });
});
