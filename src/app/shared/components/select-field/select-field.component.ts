import {
    Component,
    EventEmitter,
    Input,
    Output,
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
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';

export type FloatLabelVariant = 'in' | 'on' | 'over';

@Component({
    selector: 'app-select-field',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, SelectModule, FloatLabelModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectFieldComponent),
            multi: true,
        },
    ],
    templateUrl: './select-field.component.html',
    styleUrl: './select-field.component.scss',
})
export class SelectFieldComponent implements ControlValueAccessor {
    /** Unique id for the select – required for label accessibility */
    @Input() fieldId!: string;

    /** Label text shown on the float-label border */
    @Input() label!: string;

    /** Array of options to choose from */
    @Input() options: any[] = [];

    /** Property of an option used as its display label */
    @Input() optionLabel: string = 'label';

    /** Property of an option used as its bound value (omit to bind the whole object) */
    @Input() optionValue: string | undefined = 'value';

    /** Placeholder shown when nothing is selected */
    @Input() placeholder: string = '';

    /** Helper text shown below the field */
    @Input() hint: string = '';

    /** Whether the field is required (adds visual asterisk) */
    @Input() required: boolean = false;

    /** Whether the field is disabled */
    @Input() disabled: boolean = false;

    /** Show a search box inside the dropdown */
    @Input() filter: boolean = false;

    /** Show a clear (x) button when a value is selected */
    @Input() showClear: boolean = false;

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
     * e.g. [control]="form.get('bankAccount')"
     */
    @Input() control: AbstractControl | null = null;

    /** Emits the new value whenever the user picks a different option */
    @Output() onChange = new EventEmitter<any>();

    // ── Internal state ────────────────────────────────────────────────────────
    readonly value = signal<any>(null);
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
        return this.getErrorMessage(key, this.errors[key]);
    }

    private getErrorMessage(key: string, value: any): string {
        const messages: Record<string, string> = {
            required: 'This field is required.',
        };
        return messages[key] ?? 'Invalid selection.';
    }

    // ── ControlValueAccessor ──────────────────────────────────────────────────
    private _onChange: (v: any) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(val: any): void {
        this.value.set(val ?? null);
    }

    registerOnChange(fn: any): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onValueChange(val: any): void {
        this.value.set(val);
        this._onChange(val);
        this.onChange.emit(val);
    }

    onBlur(): void {
        this.touched.set(true);
        this.onTouched();
    }
}
