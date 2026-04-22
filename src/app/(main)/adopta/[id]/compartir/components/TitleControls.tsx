interface TitleControlsProps {
  titles: string[];
  selectedTitle: string;
  titleSize: number;
  onSelectTitle: (title: string) => void;
  onTitleSizeChange: (value: number) => void;
}

/**
 * Renders title presets, custom title input, and title size slider.
 *
 * @example
 * <TitleControls
 *   titles={titles}
 *   selectedTitle={selectedTitle}
 *   titleSize={titleSize}
 *   onSelectTitle={setSelectedTitle}
 *   onTitleSizeChange={setTitleSize}
 * />
 */
export default function TitleControls({
  titles,
  selectedTitle,
  titleSize,
  onSelectTitle,
  onTitleSizeChange,
}: TitleControlsProps) {
  return (
    <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
      <div className="space-y-3">
        <h3 className="leading-none font-semibold text-2xl">Selector de título</h3>
        {titles.map((title) => (
          <div
            key={title}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedTitle === title
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
            onClick={() => onSelectTitle(title)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{title}</span>
            </div>
          </div>
        ))}

        <div
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
            !titles.some((title) => title === selectedTitle)
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <label className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Título personalizado"
              onChange={(e) => onSelectTitle(e.target.value)}
              onClick={(e) => onSelectTitle(e.currentTarget.value)}
              className="font-medium text-gray-900 outline-0"
            ></input>
          </label>
        </div>

        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300 ">
          <label htmlFor="titleSize">Tamaño del título: </label>
          <span className="text-center">{titleSize}px</span>
          <input
            type="range"
            id="titleSize"
            min="10"
            max="60"
            value={titleSize}
            onChange={(e) => onTitleSizeChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
