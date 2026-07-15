import {
    Component,
    Input,
    forwardRef,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    AbstractControl,
    ValidationErrors,
    FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

export type FloatLabelVariant = 'in' | 'on' | 'over';

@Component({
    selector: 'app-date-field',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, DatePickerModule, FloatLabelModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateFieldComponent),
            multi: true,
        },
    ],
    templateUrl: './date-field.component.html',
    styleUrl: './date-field.component.scss',
})
export class DateFieldComponent implements ControlValueAccessor {
    /** Unique id for the input – required for label accessibility */
    @Input() fieldId!: string;

    /** Label text shown on the float-label border */
    @Input() label!: string;

    /** PrimeNG date format token (e.g. 'dd-M-yy' → 10-May-2026) */
    @Input() dateFormat: string = 'dd-M-yy';

    /** Show the calendar icon button */
    @Input() showIcon: boolean = true;

    /** Show the Today/Clear button bar in the overlay */
    @Input() showButtonBar: boolean = false;

    /** Earliest selectable date */
    @Input() minDate: Date | undefined;

    /** Latest selectable date */
    @Input() maxDate: Date | undefined;

    /** Placeholder shown when no date is selected */
    @Input() placeholder: string = '';

    /** Helper text shown below the field */
    @Input() hint: string = '';

    /** Whether the field is required (adds visual asterisk) */
    @Input() required: boolean = false;

    /** Whether the field is disabled */
    @Input() disabled: boolean = false;

    /** Width utility class (e.g. "w-full", "w-60") */
    @Input() widthClass: string = 'w-full';

    /**
     * FloatLabel display variant:
     *  - 'on'   → label sits on the top border (default)
     *  - 'in'   → label starts inside the field
     *  - 'over' → label overlays and slides up on focus
     */
    @Input() floatVariant: FloatLabelVariant = 'on';

    /**
     * Pass the AbstractControl (from reactive forms) so the component
     * can read validation state automatically.
     * e.g. [control]="form.get('voucherDate')"
     */
    @Input() control: AbstractControl | null = null;

    // ── Internal state ────────────────────────────────────────────────────────
    readonly value = signal<Date | null>(null);
    readonly touched = signal(false);

    get hasError(): boolean {
        if (this.control) {
            return this.control.invalid && (this.control.touched || this.control.dirty);
        }
        return false;
    }

    get errors(): ValidationErrors | null {
        return this.control?.errors ?? null;
    }

    get firstErrorMessage(): string {
        if (!this.errors) return '';
        const key = Object.keys(this.errors)[0];
        return this.getErrorMessage(key);
    }

    private getErrorMessage(key: string): string {
        const messages: Record<string, string> = {
            required: 'This field is required.',
        };
        return messages[key] ?? 'Invalid date.';
    }

    // ── ControlValueAccessor ──────────────────────────────────────────────────
    private onChange: (v: any) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(val: any): void {
        this.value.set(val ? new Date(val) : null);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onValueChange(val: Date | null): void {
        this.value.set(val);
        this.onChange(val);
    }

    onBlur(): void {
        this.touched.set(true);
        this.onTouched();
    }
}
