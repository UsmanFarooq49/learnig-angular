import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-upload.component.html',
    styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    /** Comma-separated MIME types or extensions (e.g. ".pdf,.jpg,.png") */
    @Input() accept = '*';
    @Input() multiple = true;
    /** Max file size in MB (files larger than this are silently dropped) */
    @Input() maxSizeMb = 10;
    /** Helper text shown under the prompt */
    @Input() hint = '';

    @Output() filesAdded = new EventEmitter<File[]>();
    @Output() rejected = new EventEmitter<File[]>();

    isDragOver = signal(false);

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
        this.handle(Array.from(event.dataTransfer?.files ?? []));
    }

    openPicker(): void {
        this.fileInput?.nativeElement.click();
    }

    onFileInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.handle(Array.from(target.files ?? []));
        target.value = ''; // allow re-picking the same file
    }

    private handle(files: File[]): void {
        const limit = this.maxSizeMb * 1024 * 1024;
        const valid = files.filter((f) => f.size <= limit);
        const tooBig = files.filter((f) => f.size > limit);
        if (valid.length) this.filesAdded.emit(valid);
        if (tooBig.length) this.rejected.emit(tooBig);
    }
}
