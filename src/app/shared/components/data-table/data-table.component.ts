import {
    Component,
    ContentChild,
    ContentChildren,
    Directive,
    EventEmitter,
    Input,
    Output,
    QueryList,
    TemplateRef,
    inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
    /** Key in the row object to read the value from */
    field: string;
    /** Column header text */
    header: string;
    /** How to render/format the cell value */
    type?: 'text' | 'number' | 'currency';
    /** Cell + header alignment (defaults: right for numeric, left otherwise) */
    align?: 'left' | 'center' | 'right';
    /** Show a red asterisk next to the header */
    required?: boolean;
    /** Sum this column in the totals footer */
    total?: boolean;
    /** Optional fixed width, e.g. "140px" */
    width?: string;
}

/**
 * Provides a custom cell renderer for a given column field.
 * Usage: <ng-template tableCell="status" let-row let-col="col" let-index="index"> … </ng-template>
 */
@Directive({
    selector: '[tableCell]',
    standalone: true,
})
export class TableCellDirective {
    @Input('tableCell') field = '';
    templateRef = inject(TemplateRef);
}

/**
 * Provides a custom renderer for the action column of every row.
 * Usage: <ng-template tableRowActions let-row let-index="index"> … </ng-template>
 */
@Directive({
    selector: '[tableRowActions]',
    standalone: true,
})
export class TableRowActionsDirective {
    templateRef = inject(TemplateRef);
}

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './data-table.component.html',
    styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
    @ContentChildren(TableCellDirective) cellTemplates!: QueryList<TableCellDirective>;
    @ContentChild(TableRowActionsDirective) rowActionsDir?: TableRowActionsDirective;

    get rowActionsTpl(): TemplateRef<any> | null {
        return this.rowActionsDir?.templateRef ?? null;
    }
    /** Column definitions that generate the header + body */
    @Input() columns: TableColumn[] = [];

    /** Row data */
    @Input() data: any[] = [];

    /** Optional section title (renders the header bar with accent + actions slot) */
    @Input() title = '';

    /** Show the leading "#" row-number column */
    @Input() showIndex = true;

    /** Show the trailing edit/delete action column */
    @Input() showActions = true;

    /** Show the totals footer row */
    @Input() showTotals = true;

    /** Text shown when there are no rows */
    @Input() emptyMessage = 'No records found.';

    /** Make rows clickable (cursor + emits rowClick) */
    @Input() clickableRows = false;

    @Output() edit = new EventEmitter<{ row: any; index: number }>();
    @Output() remove = new EventEmitter<{ row: any; index: number }>();
    @Output() rowClick = new EventEmitter<{ row: any; index: number }>();

    cellTemplate(field: string): TemplateRef<any> | null {
        return this.cellTemplates?.find((t) => t.field === field)?.templateRef ?? null;
    }

    onRowClick(row: any, index: number): void {
        if (this.clickableRows) this.rowClick.emit({ row, index });
    }

    /** Index of the first column flagged as a total (-1 if none) */
    get firstTotalIndex(): number {
        return this.columns.findIndex((c) => !!c.total);
    }

    /** colspan for the "Total Rows" footer cell (covers leading non-total cells) */
    get leadingSpan(): number {
        const base = this.showIndex ? 1 : 0;
        const fti = this.firstTotalIndex;
        return base + (fti === -1 ? this.columns.length : fti);
    }

    /** Columns rendered (aligned) in the footer, from the first total column onward */
    get trailingColumns(): TableColumn[] {
        const fti = this.firstTotalIndex;
        return fti === -1 ? [] : this.columns.slice(fti);
    }

    get fullColspan(): number {
        return (this.showIndex ? 1 : 0) + this.columns.length + (this.showActions ? 1 : 0);
    }

    isNumeric(col: TableColumn): boolean {
        return col.type === 'number' || col.type === 'currency';
    }

    alignClass(col: TableColumn): string {
        const a = col.align ?? (this.isNumeric(col) ? 'right' : 'left');
        return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
    }

    columnTotal(field: string): number {
        return this.data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
    }

    onEdit(row: any, index: number): void {
        this.edit.emit({ row, index });
    }

    onRemove(row: any, index: number): void {
        this.remove.emit({ row, index });
    }
}
