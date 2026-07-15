export const TABLE_UI = {
  base: 'table-fixed',
  thead: 'bg-elevated/50',
  th: 'text-default font-medium',
  tbody: '[&>tr:last-child>td]:border-b-0',
  td: 'empty:p-0',
}

export function tableSortHeaderProps(options: {
  label: string
  icon: string
  onClick: () => void
}) {
  return {
    label: options.label,
    color: 'neutral' as const,
    variant: 'ghost' as const,
    size: 'md' as const,
    class: '-mx-2.5 -my-1.5',
    trailingIcon: options.icon,
    onClick: options.onClick,
  }
}
