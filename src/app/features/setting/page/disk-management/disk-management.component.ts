import {
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
  AfterViewInit,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { DiskService } from '../../services/disk.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Disk } from '../../model/disk.model';
import { AddDiskDialogComponent } from '../../components/add-disk-dialog/add-disk-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-disk-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './disk-management.component.html',
  styleUrl: './disk-management.component.scss',
})
export class DiskManagementComponent implements OnInit, AfterViewInit {
  readonly diskService = inject(DiskService);
  readonly snackbarService = inject(SnackbarService);
  readonly dialog = inject(MatDialog);
  readonly route = inject(ActivatedRoute);

  readonly disks = signal<Disk[]>([]);
  readonly isLoading = signal(false);
  readonly dataSource = new MatTableDataSource<Disk | 'total'>([]);
  readonly messageBoxService = inject(MessageBoxService);

  readonly displayedColumns = [
    'disk',
    'totalSpace',
    'freeSpace',
    'usedSpace',
    'updateDate',
    'actions',
  ];

  readonly sort = viewChild(MatSort);

  readonly totalStats = computed(() => {
    const data = this.disks();
    return {
      totalSpace: data.reduce((sum, d) => sum + (d.totalSpace || 0), 0),
      freeSpace: data.reduce((sum, d) => sum + (d.freeSpace || 0), 0),
      usedSpace: data.reduce((sum, d) => sum + (this.getUsedSpace(d) || 0), 0),
    };
  });

  ngOnInit(): void {
    this.loadDisks();
  }

  ngAfterViewInit(): void {
    const sortComponent = this.sort();
    if (sortComponent) {
      this.dataSource.sort = sortComponent;
    }
  }

  loadDisks(): void {
    this.isLoading.set(true);
    this.diskService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.disks.set(data);
        this.isLoading.set(false);
      },
      error: error => {
        this.snackbarService.openI18N('msg.diskFailLoad');
        this.isLoading.set(false);
      },
    });
  }

  openAddDiskDialog(): void {
    const dialogRef = this.dialog.open(AddDiskDialogComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addDisk(result);
      }
    });
  }

  addDisk(code: string): void {
    this.diskService.add(code).subscribe({
      next: () => {
        this.snackbarService.openI18N('msg.addSuccess');
        this.loadDisks();
      },
      error: error => {
        this.snackbarService.openErrorSnackbar('msg.addFailed');
      },
    });
  }

  refresh(): void {
    this.isLoading.set(true);
    this.diskService.refresh().subscribe({
      next: () => {
        this.snackbarService.openI18N('msg.refreshSuccess');
        this.loadDisks();
      },
      error: error => {
        this.snackbarService.openErrorSnackbar('msg.refreshFailed');
        this.isLoading.set(false);
      },
    });
  }

  deleteDisk(disk: string): void {
    this.messageBoxService
      .openI18N('msg.confirmDeleteDisk', { params: { disk } })
      .pipe(
        filter(result => result === 'ok'),
        switchMap(() => this.diskService.delete(disk))
      )
      .subscribe(result => {
        this.snackbarService.openI18N(`msg.deleteSuccess`);
        this.loadDisks();
      });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  isTotal(element: Disk | 'total'): boolean {
    return element === 'total';
  }

  getUsedSpace(element: Disk): number {
    return element.totalSpace - element.freeSpace;
  }
}
