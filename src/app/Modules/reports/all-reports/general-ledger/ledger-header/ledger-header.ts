import { Component, output } from '@angular/core';
import { LedgerAction } from '../general-ledger.types';

@Component({
    selector: 'app-ledger-header',
    imports: [],
    templateUrl: './ledger-header.html',
    styleUrl: './ledger-header.scss',
})
export class LedgerHeader {
    /** Emitted when a toolbar action is clicked. */
    action = output<LedgerAction>();
}
