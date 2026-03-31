"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModalWidth = "md" | "lg" | "xl" | "2xl" | "3xl";

const widthClass: Record<ModalWidth, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalWidth;
  description?: string;
}

export function Modal({ open, onClose, title, children, footer, maxWidth = "2xl", description }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${widthClass[maxWidth]} max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal`}
        >
          {description && (
            <Dialog.Description className="sr-only">
              {description}
            </Dialog.Description>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
            <Dialog.Title className="text-base font-semibold text-sena-blue flex items-center gap-2">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
