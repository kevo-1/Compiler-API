import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ChildProcess } from 'child_process';

@Injectable()
export class DockerCleanupService implements OnModuleDestroy {
    private runningProcesses: Set<ChildProcess> = new Set();

    registerProcess(process: ChildProcess): void {
        this.runningProcesses.add(process);

        process.on('close', () => {
            this.runningProcesses.delete(process);
        });
    }

    async onModuleDestroy(): Promise<void> {
        console.log(
            `Cleaning up ${this.runningProcesses.size} running Docker containers...`,
        );

        const killPromises = Array.from(this.runningProcesses).map(
            (process) => {
                return new Promise<void>((resolve) => {
                    if (process.killed) {
                        resolve();
                        return;
                    }

                    process.once('close', () => resolve());
                    process.kill('SIGKILL');

                    setTimeout(() => resolve(), 2000);
                });
            },
        );

        await Promise.all(killPromises);
        this.runningProcesses.clear();
        console.log('Docker cleanup completed');
    }

    killAll(): void {
        this.runningProcesses.forEach((process) => {
            if (!process.killed) {
                process.kill('SIGKILL');
            }
        });
        this.runningProcesses.clear();
    }
}
