// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDZOdEdTR1PJCLZdsJ-QwSUPIg-s-vA_48",
    authDomain: "brian-8f864.firebaseapp.com",
    projectId: "brian-8f864",
    storageBucket: "brian-8f864.firebasestorage.app",
    messagingSenderId: "221822213993",
    appId: "1:221822213993:web:ef9777101f8c33fc3ce7f8",
    measurementId: "G-KWCJ2Q7W5F"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Variables globales pour gérer l'état
let isPasswordResetComplete = false;
let isCodeValid = false;

// Variable globale pour mémoriser l'état de succès
window.passwordResetSuccess = window.passwordResetSuccess || false;

// Récupération des paramètres URL
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const oobCode = urlParams.get('oobCode');

console.log('Mode:', mode);
console.log('OobCode:', oobCode);

// Vérification des paramètres et du code
if (window.passwordResetSuccess) {
    // Afficher uniquement le message de succès
    showSuccess('Votre mot de passe a été réinitialisé avec succès ! Vous allez être redirigé...');
    document.getElementById('resetForm').style.display = 'none';
} else if (!oobCode) {
    // Ne rien afficher, laisser la page blanche
    document.getElementById('mainContainer').style.display = 'none';
} else {
    // Vérifier la validité du code une seule fois au chargement
    auth.verifyPasswordResetCode(oobCode)
        .then((email) => {
            console.log('Code valide pour:', email);
            isCodeValid = true;
            showForm();
        })
        .catch((error) => {
            // Ne rien afficher, laisser la page blanche
            document.getElementById('mainContainer').style.display = 'none';
        });
}

// Validation du mot de passe en temps réel
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

newPasswordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePasswordMatch);

function validatePassword() {
    const password = newPasswordInput.value;

    // Vérification longueur
    const lengthReq = document.getElementById('lengthReq');
    if (password.length >= 8) {
        lengthReq.classList.add('valid');
    } else {
        lengthReq.classList.remove('valid');
    }

    // Vérification chiffre
    const numberReq = document.getElementById('numberReq');
    if (/\d/.test(password)) {
        numberReq.classList.add('valid');
    } else {
        numberReq.classList.remove('valid');
    }

    // Vérification majuscule
    const upperReq = document.getElementById('upperReq');
    if (/[A-Z]/.test(password)) {
        upperReq.classList.add('valid');
    } else {
        upperReq.classList.remove('valid');
    }

    // Vérification minuscule
    const lowerReq = document.getElementById('lowerReq');
    if (/[a-z]/.test(password)) {
        lowerReq.classList.add('valid');
    } else {
        lowerReq.classList.remove('valid');
    }

    validatePasswordMatch();
}

function validatePasswordMatch() {
    const password = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.style.borderColor = '#dc2626';
    } else {
        confirmPasswordInput.style.borderColor = '#e1e5e9';
    }
}

function isPasswordValid() {
    const password = newPasswordInput.value;
    return password.length >= 8 &&
        /\d/.test(password) &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password);
}

// Soumission du formulaire
document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Vérifier d'abord si le code est valide
    if (!isCodeValid) {
        showError('Le lien de réinitialisation est invalide ou a expiré.');
        return;
    }

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    hideMessages();

    if (!isPasswordValid()) {
        showError('Le mot de passe ne respecte pas tous les critères requis.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('Les mots de passe ne correspondent pas.');
        return;
    }

    setLoading(true);

    try {
        await auth.confirmPasswordReset(oobCode, newPassword);

        // Marquer que la réinitialisation est terminée avec succès
        isPasswordResetComplete = true;
        window.passwordResetSuccess = true; // <-- Sauvegarder l'état global

        showSuccess('Votre mot de passe a été réinitialisé avec succès ! Vous allez être redirigé...');
        document.getElementById('resetForm').style.display = 'none';

        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);

    } catch (error) {
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

        switch (error.code) {
            case 'auth/expired-action-code':
                errorMessage = 'Le lien de réinitialisation a expiré. Demandez un nouveau lien.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'Le lien de réinitialisation est invalide.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Le mot de passe est trop faible.';
                break;
        }

        showError(errorMessage);
        // En cas d'erreur, masquer tout
        document.getElementById('mainContainer').style.display = 'none';
    } finally {
        setLoading(false);
    }
});

function showError(message) {
    // Afficher le conteneur principal
    document.getElementById('mainContainer').style.display = 'block';

    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Cacher le formulaire en cas d'erreur
    document.getElementById('resetForm').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function showSuccess(message) {
    // Afficher uniquement le message de succès
    document.getElementById('mainContainer').style.display = 'block';
    document.getElementById('resetForm').style.display = 'none';
    const successDiv = document.getElementById('successMessage');
    successDiv.innerHTML = `
        <div class="success-icon-wrapper">
            <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="none" />
                    <path d="M7 13.5l3 3 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>
        </div>
        <div style="text-align:center;">${message}</div>
    `;
    successDiv.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function setLoading(loading) {
    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loadingDiv = document.getElementById('loading');

    if (loading) {
        btn.disabled = true;
        btnText.style.opacity = '0';
        loadingDiv.style.display = 'block';
    } else {
        btn.disabled = false;
        btnText.style.opacity = '1';
        loadingDiv.style.display = 'none';
    }
}

function showForm() {
    // Afficher le conteneur principal et le formulaire
    document.getElementById('mainContainer').style.display = 'block';
    document.getElementById('resetForm').style.display = 'block';
}