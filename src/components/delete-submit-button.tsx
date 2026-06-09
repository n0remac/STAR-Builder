"use client";

import { useFormStatus } from "react-dom";

type DeleteSubmitButtonProps = {
  children: string;
  confirmationMessage: string;
};

export function DeleteSubmitButton({
  children,
  confirmationMessage
}: DeleteSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="button-danger"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmationMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Deleting..." : children}
    </button>
  );
}
