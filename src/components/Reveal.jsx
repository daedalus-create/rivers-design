import { useReveal } from "../hooks/useReveal";

export default function Reveal({ as: Tag = "div", stagger = 0, className = "", children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal${visible ? " in" : ""}${className ? " " + className : ""}`}
      style={{ "--stagger-i": stagger }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
