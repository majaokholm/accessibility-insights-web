import { Tab } from 'common/itab';
import { NamedFC } from 'common/react/named-fc';
import { PersistedTabInfo } from 'common/types/store-data/assessment-result-data';
import { UrlParser } from 'common/url-parser';
import {
    ChangeAssessmentDialog,
    ChangeAssessmentDialogProps,
} from 'DetailsView/components/change-assessment-dialog';

import * as React from 'react';
import { DetailsViewActionMessageCreator } from '../actions/details-view-action-message-creator';

export type LoadAssessmentDialogDeps = {
    urlParser: UrlParser;
    detailsViewActionMessageCreator: DetailsViewActionMessageCreator;
};

export interface LoadAssessmentDialogProps {
    deps: LoadAssessmentDialogDeps;
    prevTab: PersistedTabInfo;
    newTab: Tab;
    show: boolean;
    onClose: () => void;
}

export const LoadAssessmentDialog = NamedFC<LoadAssessmentDialogProps>('LoadAssessment', props => {
    const dialogProps: ChangeAssessmentDialogProps = {
        deps: props.deps,
        prevTab: props.prevTab,
        newTab: props.newTab,
        dialogContentTitle: 'Assessment in progress',
        subtitleAriaId: 'load-assessment-dialog-description',
        divId: "load-assessment-dialog-description",
        leftButtonText: "Continue previous",
        leftButtonOnClick: props.deps.detailsViewActionMessageCreator
        .continuePreviousAssessment,
        rightButtonText: "Load Assessment",
        rightButtonOnClick: props.deps.detailsViewActionMessageCreator
        .loadAssessment,
        dialogFirstText: <>Would you like to continue your current assessment or load the new Assessment?</>,
        dialogNoteText: "If 'Continue previous' is selected, the assessment selected will not be loaded.",
        dialogWarningText: "If 'Load assessment’ is selected, all previous progress will be lost.",
    };

    if(!props.show) {
        return null
    }

    return (
        <ChangeAssessmentDialog {...dialogProps}
        />
    );
});
