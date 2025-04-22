'use client'
export default function ShareButton() {
    return (<button
        className="animate-bounce w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-red-heart hover:bg-green-olive uppercase"
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: 'Por Los Animales Maldonado',
              text: 'ayudanos a ayudar 🐾',
              url: window.location.href,
            }).catch((error) => console.error('Error al compartir:', error));
          } else {
            alert('Tu navegador no admite la función de compartir');
          }
        }}
      >
        Click para compartir
      </button>)}