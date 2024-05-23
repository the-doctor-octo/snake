import { CanvasScene2D } from "@octo/models";

export interface SceneHandler {
    addScene(scene: CanvasScene2D): void
    deleteScene(id: string): void;
    getCurrentScenes(): CanvasScene2D[] | undefined;
    changeScene(id: string, cleanPreviousState: boolean, loadingSceneId?: string): void
}

export class SceneManager implements SceneHandler {
    private currentScenes: CanvasScene2D[] = [];
    private ctx: CanvasRenderingContext2D | undefined
    private scenes: CanvasScene2D[] = [];

    constructor(ctx: CanvasRenderingContext2D) { this.ctx = ctx }
    addScene(scene: CanvasScene2D): void {
        if (this.scenes.findIndex((s) => s.id === scene?.id) !== -1) {
            console.warn('Scene with same id already exists, provide a new id');
            return;
        }
        this.scenes.push(scene);
    }
    deleteScene(id: string): void {
        const i = this.getSceneIndex(id, this.currentScenes)
        this.currentScenes[i].clean();
        this.currentScenes = this.currentScenes.filter((s, index) => index !== i)
    }
    getCurrentScenes(): CanvasScene2D[] | undefined {
        return this.currentScenes
    }

    async changeScene(id: string, cleanPreviousState: boolean = true, loadingSceneId?: string): Promise<void> {

        const lastCurrentSceneId = this.currentScenes[this.currentScenes.length - 1]?.id;
        const i = this.getSceneIndex(id, this.scenes);

        if (loadingSceneId !== undefined) {
            const loadingSceneIndex = this.getSceneIndex(loadingSceneId, this.scenes);
            let loadingScene: CanvasScene2D = this.scenes[loadingSceneIndex];
            const loadingScenePromises = loadingScene.init(this.ctx!);
            if (loadingScenePromises !== undefined) {
                await loadingScenePromises
            }
            this.currentScenes.push(loadingScene);
        }

        const loadPromise = this.scenes[i].init(this.ctx!);

        // TODO: handle Deregistration of last scene user inputs (mouse and keybs)
        //

        if (loadPromise !== undefined) {
            await loadPromise;
        }
        if (cleanPreviousState && lastCurrentSceneId !== undefined) {
            this.deleteScene(lastCurrentSceneId);
        }
        if (loadingSceneId !== undefined) {
            this.deleteScene(loadingSceneId);
        }
        this.currentScenes.push(this.scenes[i]);

    }

    private getSceneIndex(id: string, scenes: CanvasScene2D[]) {
        const loadingSceneIndex = scenes.findIndex((s) => s.id === id);
        if (loadingSceneIndex === -1) {
            throw new Error(`cannot find scene with id ${id}`);
        }
        return loadingSceneIndex;
    }

}