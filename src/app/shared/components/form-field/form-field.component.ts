import {
    Component,
    Input,
    forwardRef,
    signal,
    ChangeDetectionStrategy,
    AfterViewInit,
    ElementRef,
    inject,
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    AbstractControl,
    ValidationErrors,
    FormsModule,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'tel';
export type FloatLabelVariant = 'in' | 'on' | 'over';

@Component({
    selector: 'app-form-field',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        InputTextModule,
        PasswordModule,
        InputNumberModule,
        FloatLabelModule,
        IconFieldModule,
        InputIconModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FormFieldComponent),
            multi: true,
        },
    ],
    templateUrl: './form-field.component.html',
    styleUrl: './form-field.component.scss',
})
export class FormFieldComponent implements ControlValueAccessor, AfterViewInit {
    private host = inject(ElementRef<HTMLElement>);

    /** Unique id for the input – required for label accessibility */
    @Input() fieldId!: string;

    /** Label text shown above the input */
    @Input() label!: string;

    /** Input type */
    @Input() type: FormFieldType = 'text';

    /** Helper text shown below the input */
    @Input() hint: string = '';

    /** Whether the field is required (adds visual asterisk) */
    @Input() required: boolean = false;

    /** Whether the field is disabled */
    @Input() disabled: boolean = false;

    /** Focus this field's input once the view is ready (e.g. first field of a form). */
    @Input() autofocus: boolean = false;

    /** Width utility class (e.g. "w-full", "w-60") */
    @Input() widthClass: string = 'w-full';

    /**
     * FloatLabel display variant:
     *  - 'on'   → label sits on the top border (PrimeNG default style)
     *  - 'in'   → label starts inside the input
     *  - 'over' → label overlays and slides up on focus
     */
    @Input() floatVariant: FloatLabelVariant = 'on';

    /**
     * Pass the AbstractControl (from reactive forms) so the component
     * can read validation state automatically.
     * e.g. [control]="loginForm.get('email')"
     */
    @Input() control: AbstractControl | null = null;

    // ── Internal state ────────────────────────────────────────────────────────
    readonly value = signal<string | number | null>(null);
    readonly touched = signal(false);

    ngAfterViewInit(): void {
        if (!this.autofocus) return;
        // Defer so PrimeNG (p-password etc.) has rendered its inner input.
        setTimeout(() => this.host.nativeElement.querySelector('input')?.focus());
    }

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
            email: 'Please enter a valid email address.',
            minlength: `Minimum ${value?.requiredLength} characters required.`,
            maxlength: `Maximum ${value?.requiredLength} characters allowed.`,
            min: `Minimum value is ${value?.min}.`,
            max: `Maximum value is ${value?.max}.`,
            pattern: 'Invalid format.',
        };
        return messages[key] ?? 'Invalid value.';
    }

    // ── ControlValueAccessor ──────────────────────────────────────────────────
    private onChange: (v: any) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(val: any): void {
        this.value.set(val ?? null);
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

    onValueChange(val: any): void {
        this.value.set(val);
        this.onChange(val);
    }

    onBlur(): void {
        this.touched.set(true);
        this.onTouched();
    }
}
