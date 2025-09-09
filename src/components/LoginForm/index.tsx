'use client'
import { loginWithGoogle } from '@/lib/firebase/loginWithGoogle';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
export default function LoginForm() {
  const router = useRouter();
  const handleGoogleSigIn = async (): Promise<void> => {
    try {
      await loginWithGoogle();
      router.replace('/plam-admin');
    } catch (error) {
      console.error(error);
      router.replace('/login?error=unauthorized'); // Redirige a una página de error si el usuario no está autorizado
    }
  };

  return (
    <div className=" bg-white flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
         <Image width={500} height={500} className="mx-auto h-48 w-auto" src={'/logo300.webp'} alt="logo por los animales" /> 
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Hola Bienvenido!!</h2>
        <p className="mt-10 text-center text-xl font-bold  tracking-tight text-gray-900 text-balance"> Accedé con tu cuenta de Google para continuar.</p>
      </div>

      <div className=" flex flex-col gap-8 mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
       
        <button
          onClick={() => {
            handleGoogleSigIn();
          }}
          type="button"
          className="flex w-full justify-center items-center gap-4 rounded-md bg-gray-200 px-3 py-1.5 text-sm font-semibold leading-6  shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Image width={500} height={500} className="w-8 h-8" src="https://cloudinary-res.cloudinary.com/image/upload/v1645708175/sign_up/cdnlogo.com_google-icon.svg" alt=" google logo" />
          <span>Iniciar con Google</span>
        </button>

 
      </div>
    </div>
  );
}
