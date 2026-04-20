import { MODEL_TEMPLATES } from '../../utils/constants';

interface ModelSelectorProps {
  value: string;
  onChange: (template: string, name: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const templateNames = Object.keys(MODEL_TEMPLATES);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor="model-selector">
        Model Template
      </label>
      <select
        id="model-selector"
        className="form-select"
        value={value}
        onChange={(e) => {
          const name = e.target.value;
          const code = MODEL_TEMPLATES[name] || '';
          onChange(code, name);
        }}
      >
        <option value="" disabled>
          Select a model template…
        </option>
        {templateNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
