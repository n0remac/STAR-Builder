import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode
} from "react";

type ClassValue = string | false | null | undefined;

function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "aside" | "div";
};

export function Panel({
  as: Component = "section",
  className,
  ...props
}: PanelProps) {
  return <Component className={cn("card", className)} {...props} />;
}

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return <span className={cn("pill", className)} {...props} />;
}

type ButtonVariant = "primary" | "secondary";

const buttonClasses: Record<ButtonVariant, string> = {
  primary: "button",
  secondary: "button-secondary"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonClasses[variant], className)} {...props} />
  );
}

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    variant?: ButtonVariant;
  };

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonClasses[variant], className)} {...props} />
  );
}

type CardLinkVariant = "lift" | "plain";

const cardLinkClasses: Record<CardLinkVariant, string> = {
  lift:
    "group rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5 transition hover:-translate-y-0.5 hover:border-moss/40 hover:bg-white/80",
  plain:
    "rounded-[1.5rem] border border-ink/10 bg-paper/70 p-4 transition hover:border-moss/40 hover:bg-white/80"
};

type CardLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    variant?: CardLinkVariant;
  };

export function CardLink({
  className,
  variant = "lift",
  ...props
}: CardLinkProps) {
  return (
    <Link className={cn(cardLinkClasses[variant], className)} {...props} />
  );
}

type EmptyStateSize = "default" | "compact";

const emptyStateClasses: Record<EmptyStateSize, string> = {
  default:
    "mt-8 rounded-[1.5rem] border border-dashed border-ink/20 p-8 text-center text-ink/55",
  compact:
    "rounded-[1.5rem] border border-dashed border-ink/15 p-5 text-sm text-ink/55"
};

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  size?: EmptyStateSize;
};

export function EmptyState({
  className,
  size = "default",
  ...props
}: EmptyStateProps) {
  return <div className={cn(emptyStateClasses[size], className)} {...props} />;
}
