// Navbar
const menuIcon = document.getElementById('menu_icon');
const navList = document.getElementById('nav_list');

menuIcon.addEventListener('click', () => {
     navList.classList.toggle('active');
});

// Form
document.getElementById('contactForm').addEventListener('submit',
function (event) {
     event.preventDefault();

     const nome = document.getElementById('nome').value;
     const email = document.getElementById('email').value;
     const messaggio = document.getElementById('messaggio').value;

     fetch('http://localhost:3000/api/invio-contatto', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ nome, email, messaggio })
     })
         .then(response => response.json())
         .then(data => {
             alert(data.message || data.error);
         })
         .catch(error => {
             console.error('Errore:', error);
         });
});
