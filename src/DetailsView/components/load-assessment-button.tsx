// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AssessmentDataParser } from 'common/assessment-data-parser';
import { AssessmentStoreData } from 'common/types/store-data/assessment-result-data';
import { InsightsCommandButton } from 'common/components/controls/insights-command-button';
import { DetailsViewActionMessageCreator } from 'DetailsView/actions/details-view-action-message-creator';
import { LoadAssessmentHelper } from 'DetailsView/components/load-assessment-helper';
import * as React from 'react';
import {
    LoadAssessmentDialog,
    LoadAssessmentDialogProps,
} from 'DetailsView/components/load-assessment-dialog';

export type LoadAssessmentButtonDeps = {
    detailsViewActionMessageCreator: DetailsViewActionMessageCreator;
    assessmentDataParser: AssessmentDataParser;
    loadAssessmentHelper: LoadAssessmentHelper;
    loadAssessmentDialogProps: LoadAssessmentDialogProps;
};
export interface LoadAssessmentButtonProps {
    deps: LoadAssessmentButtonDeps;
    assessmentStoreData: AssessmentStoreData;
}

export interface LoadAssessmentButtonState {
    isLoadDialogOpen: boolean;
}

export class LoadAssessmentButton extends React.Component<
    LoadAssessmentButtonProps,
    LoadAssessmentButtonState
> {
    public constructor(private readonly fileReader: FileReader, props) {
        super(props);

        this.state = { isLoadDialogOpen: false };
    }

    public toggleLoadDialog() {
        this.setState({
            isLoadDialogOpen: !this.state.isLoadDialogOpen,
        });
    }

    public render(): JSX.Element {
        return (
            <>
                <InsightsCommandButton
                    iconProps={{ iconName: 'FabricOpenFolderHorizontal' }}
                    onClick={() => this.getAssessmentForLoad()}
                >
                    Load assessment
                </InsightsCommandButton>

                <LoadAssessmentDialog
                    {...this.props.deps.loadAssessmentDialogProps}
                    show={this.state.isLoadDialogOpen}
                    onClose={this.toggleLoadDialog}
                ></LoadAssessmentDialog>
            </>
        );
    }

    public getAssessmentForLoad() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.a11ywebassessment';
        const persistedAssessmentData = this.props.assessmentStoreData;

        const onReaderLoad = (readerEvent: ProgressEvent<FileReader>) => {
            const content = readerEvent.target.result as string;
            const assessmentData = this.props.deps.assessmentDataParser.parseAssessmentData(
                content,
            );
            if (persistedAssessmentData) {
                this.toggleLoadDialog;
            } else {
            this.props.deps.detailsViewActionMessageCreator.loadAssessment(assessmentData);
            }
        };
        const onInputChange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files[0];
            this.fileReader.onload = onReaderLoad;
            this.fileReader.readAsText(file, 'UTF-8');
        };

        input.onchange = onInputChange;
            input.click();
    }
}
