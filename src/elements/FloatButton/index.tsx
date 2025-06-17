interface FloatButtonProps{
  action: ()=>void,
  buttonStyle: 'add' | 'edit'
}

export default function FloatButton({ action, buttonStyle}:FloatButtonProps) {

  return (
    <div className=" w-16 h-16 fixed right-3 bottom-3 rounded-full outline flex items-center justify-center overflow-hidden opacity-50 hover:opacity-100 ">
      <button
        onClick={action}
        className="w-full h-full bg-green-400 flex items-center justify-center "
      >
        {buttonStyle === "add" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-16 h-16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        )}
        {buttonStyle === "edit" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-12 h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
