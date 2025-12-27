interface DialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function Dialog({ title, message, onClose }: DialogProps) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>{title}</h2>
        <p className="dialog-message">{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}