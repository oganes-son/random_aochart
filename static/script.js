document.addEventListener("DOMContentLoaded", function() {
    MathJax.typesetPromise();
});

const correctPassword = "sumika"; // ここに設定したいパスワードを入力

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

function wrapLatex(text) {
    return text.replace(/([^\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)/g, function(match) {
        return `\\(${match}\\)`;
    });
}

function getProblem() {
    const selectedUnits = [];
    document.querySelectorAll('.unit-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
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

        if (problemNumberElement && equationContainer && question1 && question2 && question3 && question4) {
            problemNumberElement.innerText = data.problem_number;
            equationContainer.innerHTML = wrapLatex(data.equation);
            question1.innerHTML = wrapLatex(data.q1);
            question2.innerHTML = wrapLatex(data.q2);
            question3.innerHTML = wrapLatex(data.q3);
            question4.innerHTML = wrapLatex(data.q4);
            MathJax.typesetPromise([
                equationContainer, 
                question1, 
                question2, 
                question3, 
                question4
            ]);
        }
    })
    .catch(error => {
        console.error('Fetch error:', error); // フェッチエラーをログに出力
        alert('There was an error fetching the problem. Please try again later.');
    });
}



function getSelectedProblem() {
    const problemNumber = document.getElementById('problem_number_input').value;
    fetch(`/get_selected_problem?problem_number=${problemNumber}`)
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

            if (selectedProblemNumberElement && selectedEquationContainer && selectedQuestion1 && selectedQuestion2 && selectedQuestion3 && selectedQuestion4) {
                selectedProblemNumberElement.innerText = data.problem_number;
                selectedEquationContainer.innerHTML = wrapLatex(data.equation);
                selectedQuestion1.innerHTML = wrapLatex(data.q1);
                selectedQuestion2.innerHTML = wrapLatex(data.q2);
                selectedQuestion3.innerHTML = wrapLatex(data.q3);
                selectedQuestion4.innerHTML = wrapLatex(data.q4);

                MathJax.typesetPromise([
                    selectedEquationContainer, 
                    selectedQuestion1, 
                    selectedQuestion2, 
                    selectedQuestion3, 
                    selectedQuestion4
                ]);
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function showRandomMode() {
    const randomModeElement = document.getElementById('random_mode');
    const selectModeElement = document.getElementById('select_mode');

    if (randomModeElement && selectModeElement) {
        randomModeElement.style.display = 'block';
        selectModeElement.style.display = 'none';
    }
}

function showSelectMode() {
    const randomModeElement = document.getElementById('random_mode');
    const selectModeElement = document.getElementById('select_mode');

    if (randomModeElement && selectModeElement) {
        randomModeElement.style.display = 'none';
        selectModeElement.style.display = 'block';
    }
}

function toggleAll(className) {
    const checkboxes = document.querySelectorAll(`.${className}`);
    const allCheckbox = document.getElementById(`${className}_all`);

    if (allCheckbox) {
        checkboxes.forEach(checkbox => {
            checkbox.checked = allCheckbox.checked;
        });
    }
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}
