import {
    Component,
    ContentChildren,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    QueryList,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableCellDirective } from '../data-table/data-table.component';

export interface DataGridColumn {
    /** Key in the row object */
    field: string;
    /** Column header text */
    header: string;
    /** Cell type — controls default formatting + alignment */
    type?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
    /** Override default alignment */
    align?: 'left' | 'center' | 'right';
    /** Optional CSS width, e.g. "160px" */
    width?: string;
    /** Allow sorting by this column (defaults to true) */
    sortable?: boolean;
    /** Show a per-column filter input */
    filterable?: boolean;
    /** Freeze (lock) this column to the left or right */
    frozen?: 'left' | 'right' | false;
    /** Hide this column by default (still selectable in the column toggle) */
    hidden?: boolean;
}

@Component({
    selector: 'app-main-data-grid',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        InputTextModule,
        MultiSelectModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
    ],
    templateUrl: './main-data-grid.component.html',
    styleUrl: './main-data-grid.component.scss',
})
export class MainDataGridComponent implements OnInit {
    @ViewChild('dt') dt!: Table;
    @ViewChild('searchBox') searchBoxEl?: ElementRef<HTMLInputElement>;

    /** Custom cell renderers (reuses the `[tableCell]` directive) */
    @ContentChildren(TableCellDirective) cellTemplates!: QueryList<TableCellDirective>;

    // ── Data ──────────────────────────────────────────────────────────────────
    @Input() columns: DataGridColumn[] = [];
    @Input() data: any[] = [];
    /** Unique row key — required for stable selection / expansion */
    @Input() dataKey = 'id';
    @Input() loading = false;
    @Input() emptyMessage = 'No records found.';

    // ── Defaults ON (toggleable off) ──────────────────────────────────────────
    @Input() showPaginator = true;
    @Input() rows = 10;
    @Input() rowsPerPageOptions: number[] = [10, 25, 50, 100];

    /**
     * Lazy (server-side) pagination/sort/filter. When `true`, the table no longer
     * paginates the `data` input client-side — it fires `lazyLoad` on every
     * page/sort/filter change and waits for the parent to refetch.
     * Set `totalRecords` to the server's total so the paginator shows the right page count.
     */
    @Input() lazy = false;
    @Input() totalRecords = 0;
    @Output() lazyLoad = new EventEmitter<TableLazyLoadEvent>();
    @Input() showGlobalSearch = true;
    /** Restrict the global search to specific fields (defaults to all column fields) */
    @Input() globalFilterFields: string[] | null = null;
    @Input() scrollable = true;
    @Input() scrollHeight = '';

    // ── Opt-in features ───────────────────────────────────────────────────────
    /** 'single' | 'multiple' — multiple adds a leading checkbox column */
    @Input() selectionMode: 'single' | 'multiple' | null = null;
    /** Show the column visibility multiselect */
    @Input() showColumnToggle = false;
    /** Show the Export CSV button */
    @Input() showExport = false;
    @Input() exportFilename = 'export';
    /** Show a global Clear button (clears filters, sort, page, and the search box) */
    @Input() showClear = true;
    /** Allow drag-resizing columns */
    @Input() resizable = false;
    @Input() columnResizeMode: 'fit' | 'expand' = 'fit';
    /** 'row' = filter row under headers · 'menu' = filter icon opens an overlay */
    @Input() filterDisplay: 'row' | 'menu' = 'menu';
    /** Group rows by this field (renders a subheader row) */
    @Input() rowGroupField: string | null = null;

    // ── Selection two-way binding ─────────────────────────────────────────────
    @Input() selection: any = null;
    @Output() selectionChange = new EventEmitter<any>();
    @Output() rowClick = new EventEmitter<any>();
    @Output() rowDblClick = new EventEmitter<any>();

    // ── Internal state ────────────────────────────────────────────────────────
    visibleColumns: DataGridColumn[] = [];

    ngOnInit(): void {
        this.visibleColumns = this.columns.filter((c) => !c.hidden);
    }

    cellTemplate(field: string) {
        return this.cellTemplates?.find((t) => t.field === field)?.templateRef ?? null;
    }

    get effectiveGlobalFilterFields(): string[] {
        return this.globalFilterFields ?? this.columns.map((c) => c.field);
    }

    get bodyColspan(): number {
        let n = this.visibleColumns.length;
        if (this.selectionMode === 'multiple') n += 1;
        return n;
    }

    get effectiveRowGroupMode(): 'subheader' | undefined {
        return this.rowGroupField ? 'subheader' : undefined;
    }

    isNumeric(col: DataGridColumn): boolean {
        return col.type === 'number' || col.type === 'currency';
    }

    alignClass(col: DataGridColumn): string {
        const a = col.align ?? (this.isNumeric(col) ? 'right' : 'left');
        return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
    }

    filterType(col: DataGridColumn): 'text' | 'numeric' | 'date' | 'boolean' {
        if (col.type === 'number' || col.type === 'currency') return 'numeric';
        if (col.type === 'date') return 'date';
        if (col.type === 'boolean') return 'boolean';
        return 'text';
    }

    onGlobalFilter(value: string): void {
        this.dt?.filterGlobal(value, 'contains');
    }

    exportCsv(): void {
        this.dt?.exportCSV();
    }

    /** Clear all filters, sort, page index, search box, and restore the original visible columns. */
    clearTable(): void {
        this.dt?.clear();
        this.visibleColumns = this.columns.filter((c) => !c.hidden);
        const input = this.searchBoxEl?.nativeElement;
        if (input) input.value = '';
    }

    onSelectionChange(sel: any): void {
        this.selection = sel;
        this.selectionChange.emit(sel);
    }
}
