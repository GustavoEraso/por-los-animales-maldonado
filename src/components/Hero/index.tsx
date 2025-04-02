export default function Hero() {
    return (
        <div className="flex justify-center  w-full h-dvh bg-[url('/heroImg.jpg')] bg-fixed bg-cover bg-center">
            <div className="flex flex-col md:flex-row items-center md:justify-around w-full max-w-5xl">

                <img src="/logo300.png" alt="logo de por los animales maldonado" />
                <div className="flex  items-center justify-center flex-col">

                    <h1 className="text-4xl font-bold text-white">¡Adopta un amigo!</h1>
                    <p className="mt-4 text-lg text-white">Tu compañero ideal te está esperando</p>
                    <button className="mt-6 px-6 py-2 text-lg font-semibold text-white bg-blue-500 rounded hover:bg-blue-600">
                        ¡Adopta ahora!
                    </button>
                </div>
            </div>
        </div>
    );
}