'use client'
export default function ShareButton({animate = true}: { animate?: boolean}) {
    return (<button
        className={`${animate ? 'animate-bounce': ''} w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase`}
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
        Compartir Con Enlace
      </button>)}