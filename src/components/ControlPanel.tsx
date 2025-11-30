import { CloudUpload } from "lucide-react";
import { useState, useRef, DragEvent } from "react";
const ControlPanel = () => {
  const [selectedLang, setSelectedLang] = useState<"angol" | "spanyol">("angol");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      console.log('Files uploaded:', Array.from(files).map(f => f.name));
      // Add your file handling logic here
    }
  };
  const preventDefaults = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter = (e: DragEvent) => {
    preventDefaults(e);
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent) => {
    preventDefaults(e);
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent) => {
    preventDefaults(e);
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };
  return <aside className="lg:col-span-1">
      <div className="w-full max-w-md rounded-3xl bg-card/60 backdrop-blur-xl ring-1 ring-border shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)] sticky top-20">
        {/* Header Section */}
        <header className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {/* Icon Badge */}
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border shadow-inner">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.054 15.987H3.946"></path>
                </svg>
              </div>
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"></span>
            </div>
            
            {/* Title */}
            <div className="pt-0.5">
              <h1 className="text-[22px] leading-6 tracking-tight font-semibold text-foreground">Vezérlőközpont</h1>
              <p className="text-[13px] leading-5 text-muted-foreground">Eredmények feltöltése</p>
            </div>
          </div>

          {/* Upload Button */}
          <button onClick={handleFileUpload} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-foreground bg-gradient-to-b from-muted/50 to-muted ring-1 ring-border hover:from-muted/60 hover:to-muted/90 hover:-translate-y-0.5 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <CloudUpload className="h-4 w-4" />
            <span>Feltöltés</span>
          </button>
        </header>

        {/* Language Selector */}
        <div className="px-4 sm:px-5">
          <div className="mx-auto mb-5 mt-1 w-full max-w-[200px]">
            <div className="relative flex items-center rounded-full p-1 bg-gradient-to-b from-muted/30 to-muted/60 ring-1 ring-border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              {/* Active Thumb */}
              <div className="absolute top-1 left-1 h-[34px] w-[90px] rounded-full bg-gradient-to-b from-muted to-card backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_1px_1px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out" style={{
              transform: `translateX(${selectedLang === "angol" ? "0px" : "90px"})`
            }}></div>
              
              {/* Options */}
              <button onClick={() => setSelectedLang("angol")} className={`text-[13px] transition-all duration-200 h-[34px] z-10 px-5 relative translate-x-2 ${selectedLang === "angol" ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground/70"}`}>
                Angol
              </button>
              <button onClick={() => setSelectedLang("spanyol")} className={`text-[13px] transition-all duration-200 h-[34px] z-10 px-5 relative translate-x-4 ${selectedLang === "spanyol" ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground/70"}`}>
                Spanyol
              </button>
            </div>
          </div>
        </div>

        {/* File Drop Zone */}
        <div className="px-4 sm:px-5 pb-5">
          <label htmlFor="file-input" className="group block cursor-pointer rounded-2xl bg-muted/50 p-3 ring-1 ring-border hover:ring-primary/50 transition-all" onDragEnter={handleDragEnter} onDragOver={preventDefaults} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="rounded-2xl border border-border bg-muted/50 p-1.5">
              <div className={`relative aspect-square w-full rounded-2xl bg-muted/80 ring-1 overflow-hidden transition-all ${isDragging ? "ring-primary/50" : "ring-border"}`}>
                
                {/* Inner Border */}
                <div className="pointer-events-none absolute inset-3 rounded-2xl ring-1 ring-border"></div>

                {/* Plus Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-6 w-6 text-foreground group-hover:scale-105 group-hover:rotate-90 transition-transform duration-300">
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-foreground/80"></span>
                    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-foreground/80"></span>
                  </div>
                </div>

                {/* Hover Text */}
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity">
                  Fájl hozzáadása vagy húzd ide
                </div>
              </div>
            </div>
          </label>
          <input ref={fileInputRef} type="file" id="file-input" className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>

        {/* Outer Glow */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-border"></div>
      </div>
    </aside>;
};
export default ControlPanel;