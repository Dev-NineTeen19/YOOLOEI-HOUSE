import { useState, useRef, useEffect } from "react";

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "เลือกหรือพิมพ์ค้นหา...",
  icon = "fa-chevron-down",
  className = "",
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState(value || "");
  const containerRef = useRef(null);

  useEffect(() => {
    setFilterText(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setFilterText(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (opt) => {
    setFilterText(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFilterText("");
    onChange("");
    setIsOpen(false);
  };

  // Filter options based on typed input (case-insensitive)
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes((filterText || "").toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${className}`}
      style={{ position: "relative", width: "100%", ...style }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "0 12px",
          height: "44px",
          gap: "8px",
          boxShadow: isOpen ? "0 0 0 2px rgba(125, 162, 124, 0.3)" : "none",
          borderColor: isOpen ? "#7da27c" : "#d1d5db",
          transition: "all 0.2s ease",
          cursor: "text"
        }}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          value={filterText}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            outline: "none",
            fontSize: "14px",
            color: "#1f2937",
            backgroundColor: "transparent",
            width: "100%"
          }}
        />

        {filterText && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "2px",
              display: "flex",
              alignItems: "center"
            }}
            title="ล้างข้อมูล"
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: "14px" }}></i>
          </button>
        )}

        <i
          className={`fa-solid ${icon}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            cursor: "pointer",
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
          }}
        ></i>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: "220px",
            overflowY: "auto",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            padding: "4px 0"
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "#374151",
                  cursor: "pointer",
                  backgroundColor: opt === value ? "#eef6ee" : "transparent",
                  fontWeight: opt === value ? "600" : "400",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (opt !== value) e.target.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  if (opt !== value) e.target.style.backgroundColor = "transparent";
                }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div style={{ padding: "10px 14px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
              กดเพื่อเลือก หรือค้นหาด้วยคำว่า "{filterText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
