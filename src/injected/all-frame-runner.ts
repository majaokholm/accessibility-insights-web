// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { HTMLElementUtils } from 'common/html-element-utils';
import { WindowUtils } from 'common/window-utils';
import { FrameMessenger } from 'injected/frameCommunicators/frame-messenger';
import {
    CommandMessage,
    CommandMessageResponse,
} from 'injected/frameCommunicators/respondable-command-message-communicator';

export interface AllFrameRunnerTarget<T> {
    commandSuffix: string;
    start: () => void;
    stop: () => void;
    transformChildResultForParent: (fromChild: T, messageSourceFrame: HTMLIFrameElement) => T;
    setResultCallback: (reportResults: (payload: T) => Promise<void>) => void;
}

/*
This class ('runner' below) runs methods in AllFrameRunnerTargets ('target' below) in all child
frames. Runner manages communication between child frames and the top-level window so that the
target can produce results without explicit frame-communication code. 

It follows these semantics:
- target.commandSuffix is used to construct globally unique FrameMessenger commands in runner
- runner.initialize() should be called & runner.topWindowCallback should be set 
before calling runner.start() / runner.stop()
- runner.start() will run target.start() in the current frame, and then in any child frames
- runner.stop() will run target.stop() in the current frame, and then in any child frames
- runner provides target with a reportResults callback. When target.reportResults(payload) is 
called, runner propogates payload to parent frames. In each parent frame, runner replaces the 
payload with target.transformChildResultForParent(payload). When the result reaches the top window, 
runner calls topWindowCallback(payload)
*/
export class AllFrameRunner<T> {
    public topWindowCallback: (result: T) => void;

    constructor(
        private readonly frameMessenger: FrameMessenger,
        private readonly htmlElementUtils: HTMLElementUtils,
        private readonly windowUtils: WindowUtils,
        private readonly listener: AllFrameRunnerTarget<T>,
        private readonly startCommand = `insights.startFrameRunner-${listener.commandSuffix}`,
        private readonly stopCommand = `insights.stopFrameRunner-${listener.commandSuffix}`,
        private readonly onResultFromChildFrameCommand = `insights.resultFromChild-${listener.commandSuffix}`,
    ) {}

    public initialize() {
        this.frameMessenger.addMessageListener(this.startCommand, async () => {
            await this.start();
            return null;
        });
        this.frameMessenger.addMessageListener(this.stopCommand, async () => {
            await this.stop();
            return null;
        });
        this.frameMessenger.addMessageListener(
            this.onResultFromChildFrameCommand,
            this.onResultFromChildFrame,
        );

        this.listener.setResultCallback(async payload => {
            await this.reportResultsThroughFrames(payload);
        });
    }

    public start = async () => {
        this.listener.start();
        await this.sendCommandToFrames(this.startCommand);
    };

    public stop = async () => {
        this.listener.stop();
        await this.sendCommandToFrames(this.stopCommand);
    };

    private reportResultsThroughFrames = async (
        payload: T,
    ): Promise<CommandMessageResponse | null> => {
        if (this.windowUtils.isTopWindow()) {
            this.topWindowCallback(payload);
            return {
                payload,
            };
        } else {
            return await this.sendResultsToParent(payload);
        }
    };

    private sendCommandToFrames = async (command: string) => {
        const iframes = this.getAllFrames();
        for (let i = 0; i < iframes.length; i++) {
            await this.frameMessenger.sendMessageToFrame(iframes[i], {
                command,
            });
        }
    };

    private onResultFromChildFrame = async (
        commandMessage: CommandMessage,
        messageSourceWin: Window,
    ): Promise<CommandMessageResponse | null> => {
        const payload = commandMessage.payload;
        const messageSourceFrame = this.getFrameElementForWindow(messageSourceWin);
        if (messageSourceFrame != null) {
            const newResult = this.listener.transformChildResultForParent(
                payload,
                messageSourceFrame,
            );

            return await this.reportResultsThroughFrames(newResult);
        } else {
            throw new Error('unable to get frame element for the given window');
        }
    };

    private sendResultsToParent = async (payload: T): Promise<CommandMessageResponse> => {
        const message: CommandMessage = {
            command: this.onResultFromChildFrameCommand,
            payload,
        };
        return this.frameMessenger.sendMessageToWindow(this.windowUtils.getParentWindow(), message);
    };

    private getFrameElementForWindow(win: Window): HTMLIFrameElement | null {
        const frames = this.getAllFrames();

        for (let index = 0; index < frames.length; index++) {
            if (this.htmlElementUtils.getContentWindow(frames[index]) === win) {
                return frames[index];
            }
        }

        return null;
    }

    private getAllFrames(): HTMLCollectionOf<HTMLIFrameElement> {
        return this.htmlElementUtils.getAllElementsByTagName(
            'iframe',
        ) as HTMLCollectionOf<HTMLIFrameElement>;
    }
}
