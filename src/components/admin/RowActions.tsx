import { Icon } from "@/components/ui/Icon";

/** Acciones por fila con área táctil de 44 px: editar (azul) y eliminar (rojo). */
export function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {onEdit && (
        <button type="button" onClick={onEdit} className="btn-plain px-2.5 text-[14px]">
          Editar
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar"
          title="Eliminar"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
        >
          <Icon name="trash" className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}
