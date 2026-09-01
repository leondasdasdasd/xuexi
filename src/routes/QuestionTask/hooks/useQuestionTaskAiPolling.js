import { useCallback, useEffect } from "react";

import {
  queryQuestionAnalysisTasks,
  queryQuestionQualityCheckTasks,
} from "../../../services/questionTaskAiTask";
import { queryTaskItemsInChunks } from "../models/questionTaskAiTaskModel";

const AI_TASK_POLL_INTERVAL = 10_000;

const useQuestionTaskAiTaskPoller = ({
  applyAndPersistAiTaskItems,
  buildTaskItemsPatch,
  queryTaskItems,
  runningUuids,
  taskId,
}) => {
  useEffect(
    (event) => {
      void event;
      if (taskId === "mock" || runningUuids.length === 0) {
        return;
      }

      const pollState = {
        disposed: false,
        requestRunning: false,
      };

      const pollTasks = async (pollEvent) => {
        void pollEvent;

        if (pollState.requestRunning || pollState.disposed) {
          return;
        }

        pollState.requestRunning = true;

        try {
          const items = await queryTaskItemsInChunks(
            runningUuids,
            queryTaskItems,
          );

          if (!pollState.disposed) {
            await applyAndPersistAiTaskItems(buildTaskItemsPatch(items));
          }
        } catch (error) {
          void error;
        } finally {
          pollState.requestRunning = false;
        }
      };

      const timer = window.setInterval(pollTasks, AI_TASK_POLL_INTERVAL);
      void pollTasks();

      return (cleanupEvent) => {
        void cleanupEvent;
        pollState.disposed = true;
        window.clearInterval(timer);
      };
    },
    [
      applyAndPersistAiTaskItems,
      buildTaskItemsPatch,
      queryTaskItems,
      runningUuids,
      taskId,
    ],
  );
};

export const useQuestionTaskAiPolling = ({
  questionTypeBlank,
  setTaskResult,
  silentSaveAiTaskState,
  taskId,
  toVisibleQuestionState,
}) => {
  const applyAndPersistAiTaskItems = useCallback(
    async ({ analysisItems = [], qualityItems = [] } = {}) => {
      const mergeHolder = {};

      setTaskResult((previousTaskResult) => {
        const mergeResult = toVisibleQuestionState.mergeTaskItemsIntoTaskResult(
          previousTaskResult,
          questionTypeBlank,
          {
            analysisItems,
            qualityItems,
          },
        );

        mergeHolder.current = mergeResult;
        return mergeResult.changed
          ? mergeResult.taskResult
          : previousTaskResult;
      });

      if (mergeHolder.current && mergeHolder.current.changed) {
        await silentSaveAiTaskState(mergeHolder.current.taskResult);
      }
    },
    [
      questionTypeBlank,
      setTaskResult,
      silentSaveAiTaskState,
      toVisibleQuestionState,
    ],
  );

  useQuestionTaskAiTaskPoller({
    applyAndPersistAiTaskItems,
    buildTaskItemsPatch: (analysisItems) => ({ analysisItems }),
    queryTaskItems: queryQuestionAnalysisTasks,
    runningUuids: toVisibleQuestionState.runningAnalysisUuids,
    taskId,
  });
  useQuestionTaskAiTaskPoller({
    applyAndPersistAiTaskItems,
    buildTaskItemsPatch: (qualityItems) => ({ qualityItems }),
    queryTaskItems: queryQuestionQualityCheckTasks,
    runningUuids: toVisibleQuestionState.runningQualityUuids,
    taskId,
  });

  return {
    applyAndPersistAiTaskItems,
  };
};
