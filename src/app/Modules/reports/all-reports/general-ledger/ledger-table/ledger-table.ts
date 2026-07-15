import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LedgerRow, ViewMode } from '../general-ledger.types';

@Component({
    selector: 'app-ledger-table',
    imports: [CommonModule, FormsModule],
    templateUrl: './ledger-table.html',
    styleUrl: './ledger-table.scss',
})
export class LedgerTable {
    /** Flattened, render-ready rows (only the currently-visible nodes). */
    rows = input<LedgerRow[]>([]);
    entryCount = input(0);
    viewMode = input<ViewMode>('subsidiary');
    searchTerm = input('');

    /** A group/account row was clicked to expand or collapse. */
    toggleNode = output<LedgerRow>();
    viewModeChange = output<ViewMode>();
    searchTermChange = output<string>();
}
