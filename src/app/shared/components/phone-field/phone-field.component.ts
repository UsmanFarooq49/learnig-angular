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
import { InputMaskModule } from 'primeng/inputmask';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-phone-field',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, InputMaskModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneFieldComponent),
            multi: true,
        },
    ],
    templateUrl: './phone-field.component.html',
    styleUrl: './phone-field.component.scss',
})
export class PhoneFieldComponent implements ControlValueAccessor {
    @Input() fieldId!: string;
    @Input() label: string = 'Phone Number';
    @Input() mask: string = '399-9999999';
    @Input() placeholder: string = '3XX-XXXXXXX';
    @Input() hint: string = '';
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() widthClass: string = 'w-full';
    @Input() control: AbstractControl | null = null;

    readonly value = signal<string | null>(null);
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
            required: 'Phone number is required.',
            pattern: 'Please enter a valid phone number.',
            minlength: `Minimum ${value?.requiredLength} characters required.`,
        };
        return messages[key] ?? 'Invalid phone number.';
    }

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
