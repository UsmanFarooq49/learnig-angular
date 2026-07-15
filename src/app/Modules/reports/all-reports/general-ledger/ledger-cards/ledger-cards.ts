import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ledger-cards',
    imports: [CommonModule],
    templateUrl: './ledger-cards.html',
    styleUrl: './ledger-cards.scss',
})
export class LedgerCards {
    totalDebit = input(0);
    totalCredit = input(0);
    netMovement = input(0);
    entryCount = input(0);
}
