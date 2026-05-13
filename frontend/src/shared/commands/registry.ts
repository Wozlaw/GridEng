import AirIcon from '@mui/icons-material/Air';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import DomainIcon from '@mui/icons-material/Domain';
import DownloadIcon from '@mui/icons-material/Download';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import GavelIcon from '@mui/icons-material/Gavel';
import GridOnIcon from '@mui/icons-material/GridOn';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LockIcon from '@mui/icons-material/Lock';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TerminalIcon from '@mui/icons-material/Terminal';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { useLayoutStore, useModelStore, useUiStore, type AppThemeMode } from '../../app/store';
import { downloadGridEngJson } from '../../features/export-json/exportGridEngJson';
import { useCommandConsoleStore } from '../../features/console/store';
import { openMaterialsDialog, openProfilesDialog } from '../../features/project-catalogs';
import { getSelectedEntityLabel } from '../../features/selection';
import { ACTIVE_VIEW_MODES, isActiveViewMode, type ActiveViewMode } from '../../features/view-modes';
import { openWindEditorDialog } from '../../features/wind-editor';
import { translate, type AppLanguage } from '../i18n';
import { notifyError, notifyInfo, notifyNotImplemented, notifySuccess } from '../ui';
import type {
  AppCommandDefinition,
  AppConsoleCommandDefinition,
  AppConsoleCommandResult,
  RibbonCommandGroupDefinition,
} from './types';

const VISIBILITY_KEYS = ['axes', 'grid', 'loads', 'restraints', 'labels'] as const;

function localize(language: AppLanguage, ru: string, en: string): string {
  return language === 'ru' ? ru : en;
}

function getCommandLabel(language: AppLanguage, key: AppCommandDefinition['labelKey']): string {
  return translate(language, key);
}

function notifyPlaceholder(labelKey: AppCommandDefinition['labelKey']) {
  const language = useUiStore.getState().language;
  notifyNotImplemented(getCommandLabel(language, labelKey));
}

function setViewMode(viewMode: ActiveViewMode) {
  useModelStore.getState().setViewMode(viewMode);
}

function applyLanguage(language: AppLanguage) {
  useUiStore.getState().setLanguage(language);

  notifySuccess({
    title: translate(language, 'notifications.languageChanged.title'),
    details: [
      translate(language, 'notifications.languageChanged.detail', {
        language: translate(language, `language.name.${language}`),
      }),
    ],
  });
}

function getThemeModeLabel(language: AppLanguage, themeMode: AppThemeMode): string {
  return themeMode === 'light'
    ? localize(language, 'светлая grayscale', 'light grayscale')
    : localize(language, 'темная grayscale', 'dark grayscale');
}

function applyThemeMode(themeMode: AppThemeMode) {
  useUiStore.getState().setThemeMode(themeMode);
}

function toggleThemeMode(): AppThemeMode {
  useUiStore.getState().toggleThemeMode();
  return useUiStore.getState().themeMode;
}

function toggleVisibility(key: typeof VISIBILITY_KEYS[number]) {
  const { visibility, setVisibility } = useModelStore.getState();
  setVisibility({ [key]: !visibility[key] });
}

function setVisibilityValue(key: typeof VISIBILITY_KEYS[number], value: boolean) {
  useModelStore.getState().setVisibility({ [key]: value });
}

function exportCurrentModel(language: AppLanguage): { ok: true; fileName: string } | { ok: false; error: string } {
  const model = useModelStore.getState().model;

  try {
    const fileName = downloadGridEngJson(model);

    notifySuccess({
      title: translate(language, 'exportJson.feedback.successTitle', { fileName }),
      details: [translate(language, 'exportJson.feedback.successDetail')],
    });

    return {
      ok: true,
      fileName,
    };
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : translate(language, 'exportJson.feedback.unknownError');

    notifyError({
      title: translate(language, 'exportJson.feedback.errorTitle'),
      details: [message],
    });

    return {
      ok: false,
      error: message,
    };
  }
}

function openProjectProfilesCatalog() {
  openProfilesDialog();
}

function openProjectMaterialsCatalog() {
  openMaterialsDialog();
}

function openManualWindEditor() {
  openWindEditorDialog();
}

function validateCurrentModel() {
  useModelStore.getState().validateModel();
  return useModelStore.getState().validationReport;
}

function resetCurrentModel() {
  useModelStore.getState().resetToSampleModel();
  return useModelStore.getState().model;
}

function parseBooleanArgument(value: string): boolean | null {
  switch (value.trim().toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return null;
  }
}

function parseOnOffArgument(value: string): boolean | null {
  switch (value.trim().toLowerCase()) {
    case 'on':
      return true;
    case 'off':
      return false;
    default:
      return null;
  }
}

function parseFiniteNumberArgument(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatJsonLines(value: unknown): string[] {
  return JSON.stringify(value, null, 2).split('\n');
}

function indentLines(lines: string[]): string[] {
  return lines.map((line) => `  ${line}`);
}

function buildConsoleHelpOverview(language: AppLanguage): AppConsoleCommandResult {
  const commands = [...CONSOLE_COMMANDS].sort((left, right) =>
    left.names[0].localeCompare(right.names[0]),
  );

  return {
    severity: 'info',
    title: localize(language, 'Доступные команды', 'Available commands'),
    lines: [
      ...commands.map((command) => `- ${command.syntax}`),
      localize(
        language,
        'Используйте `help <command>` для синтаксиса и примеров.',
        'Use `help <command>` for syntax and examples.',
      ),
    ],
  };
}

function buildConsoleCommandHelp(
  commandName: string,
  language: AppLanguage,
): AppConsoleCommandResult {
  const command = CONSOLE_COMMANDS.find((candidate) =>
    candidate.names.some((name) => name.toLowerCase() === commandName.toLowerCase())
  );

  if (command == null) {
    return {
      severity: 'warning',
      title: localize(language, 'Команда не найдена.', 'Command not found.'),
      lines: [
        localize(
          language,
          `Команда \`${commandName}\` не зарегистрирована.`,
          `Command \`${commandName}\` is not registered.`,
        ),
      ],
      notify: true,
    };
  }

  return {
    severity: 'info',
    title: `${localize(language, 'Команда', 'Command')}: ${command.names[0]}`,
    lines: [
      `${localize(language, 'Синтаксис', 'Syntax')}: ${command.syntax}`,
      `${localize(language, 'Псевдонимы', 'Aliases')}: ${command.names.slice(1).join(', ') || localize(language, 'нет', 'none')}`,
      `${localize(language, 'Параметры', 'Parameters')}:`,
      ...(command.parameters?.length
        ? command.parameters.map((parameter) => `- ${parameter}`)
        : [`- ${localize(language, 'нет', 'none')}`]),
      `${localize(language, 'Примеры', 'Examples')}:`,
      ...(command.examples?.length
        ? command.examples.map((example) => `- ${example}`)
        : [`- ${command.names[0]}`]),
    ],
  };
}

function buildValidationLines(language: AppLanguage) {
  const report = useModelStore.getState().validationReport;
  const summaryLine = localize(
    language,
    `Ошибки: ${report.errors.length}; предупреждения: ${report.warnings.length}.`,
    `Errors: ${report.errors.length}; warnings: ${report.warnings.length}.`,
  );

  return [
    summaryLine,
    ...report.issues.map((issue) => `- [${issue.severity}] ${issue.message}`),
  ];
}

function buildModelSummaryLines(language: AppLanguage): string[] {
  const model = useModelStore.getState().model;
  const loadCount = model.loadCases.reduce((sum, loadCase) => sum + loadCase.loads.length, 0);

  return [
    `${localize(language, 'Модель', 'Model')}: ${model.name}`,
    `${localize(language, 'Узлы', 'Nodes')}: ${model.nodes.length}`,
    `${localize(language, 'Элементы', 'Members')}: ${model.members.length}`,
    `${localize(language, 'Профили', 'Profiles')}: ${model.profiles.length}`,
    `${localize(language, 'Материалы', 'Materials')}: ${model.materials.length}`,
    `${localize(language, 'Закрепления', 'Restraints')}: ${model.restraints.length}`,
    `${localize(language, 'Загружения', 'Load cases')}: ${model.loadCases.length}`,
    `${localize(language, 'Нагрузки', 'Loads')}: ${loadCount}`,
  ];
}

function buildSettingsShowLines(language: AppLanguage): string[] {
  const modelState = useModelStore.getState();
  const layoutState = useLayoutStore.getState();
  const uiState = useUiStore.getState();

  return [
    `${localize(language, 'UI settings', 'UI settings')}:`,
    ...indentLines(formatJsonLines({
      language: uiState.language,
      themeMode: uiState.themeMode,
      projectTreeWidth: layoutState.projectTreeWidth,
      projectTreeCollapsed: layoutState.projectTreeCollapsed,
      propertiesWidth: layoutState.propertiesWidth,
      propertiesCollapsed: layoutState.propertiesCollapsed,
      visibility: modelState.visibility,
      viewMode: modelState.viewMode,
    })),
    `${localize(language, 'Model settings', 'Model settings')}:`,
    ...indentLines(formatJsonLines(modelState.model.settings)),
    `${localize(language, 'DXF settings', 'DXF settings')}:`,
    ...indentLines(formatJsonLines(modelState.dxfImportSettings)),
  ];
}

function buildImportMetaLines(language: AppLanguage): string[] {
  const { model, dxfImportSettings } = useModelStore.getState();

  if (model.importMeta == null) {
    return [
      localize(language, 'Импорт-метаданные отсутствуют.', 'Import metadata is not available.'),
    ];
  }

  return [
    `${localize(language, 'Import meta', 'Import meta')}:`,
    ...indentLines(formatJsonLines(model.importMeta)),
    `${localize(language, 'Текущие DXF settings', 'Current DXF settings')}:`,
    ...indentLines(formatJsonLines(dxfImportSettings)),
  ];
}

function buildDxfSettingsLines(): string[] {
  const { dxfImportSettings } = useModelStore.getState();

  return [
    `toleranceMm = ${dxfImportSettings.toleranceMm}`,
    `centerOnXY = ${String(dxfImportSettings.centerOnXY)}`,
    `force2DToXY = ${String(dxfImportSettings.force2DToXY)}`,
  ];
}

function resetDxfSettingsToDefaults() {
  const { model, updateDxfImportSettings } = useModelStore.getState();
  updateDxfImportSettings({
    toleranceMm: model.settings.nodeMergeToleranceMm,
    centerOnXY: model.settings.centerModelByXYProjection,
    force2DToXY: true,
  });
}

function notifyReservedFeature(title: string, details: string[]) {
  notifyInfo({
    title,
    details,
  });
}

function buildDebugEntityLines(value: unknown): string[] {
  return formatJsonLines(value);
}

export const APP_COMMANDS: AppCommandDefinition[] = [
  {
    id: 'document.openProject',
    labelKey: 'commands.document.openProject.label',
    tooltipKey: 'commands.document.openProject.tooltip',
    icon: FileOpenIcon,
    placeholder: true,
    handler: () => notifyPlaceholder('commands.document.openProject.label'),
  },
  {
    id: 'document.saveProject',
    labelKey: 'commands.document.saveProject.label',
    tooltipKey: 'commands.document.saveProject.tooltip',
    icon: SaveOutlinedIcon,
    placeholder: true,
    handler: () => notifyPlaceholder('commands.document.saveProject.label'),
  },
  {
    id: 'document.importJson',
    labelKey: 'commands.document.importJson.label',
    tooltipKey: 'commands.document.importJson.tooltip',
    icon: FileOpenIcon,
    handler: (context) => context.openJsonPicker?.(),
  },
  {
    id: 'document.importDxf',
    labelKey: 'commands.document.importDxf.label',
    tooltipKey: 'commands.document.importDxf.tooltip',
    icon: FileUploadIcon,
    handler: (context) => context.openDxfDialog?.(),
  },
  {
    id: 'document.exportJson',
    labelKey: 'commands.document.exportJson.label',
    tooltipKey: 'commands.document.exportJson.tooltip',
    icon: DownloadIcon,
    handler: () => {
      exportCurrentModel(useUiStore.getState().language);
    },
  },
  {
    id: 'document.exportDxf',
    labelKey: 'commands.document.exportDxf.label',
    tooltipKey: 'commands.document.exportDxf.tooltip',
    icon: DownloadIcon,
    placeholder: true,
    handler: () => notifyPlaceholder('commands.document.exportDxf.label'),
  },
  {
    id: 'view.fit',
    labelKey: 'commands.view.fit.label',
    tooltipKey: 'commands.view.fit.tooltip',
    icon: FitScreenIcon,
    hotkey: 'F',
    isDisabled: () => useModelStore.getState().model.nodes.length === 0,
    handler: () => useModelStore.getState().requestFitToModel(),
  },
  {
    id: 'view.wireframe',
    labelKey: 'viewMode.wireframe',
    tooltipKey: 'commands.view.wireframe.tooltip',
    icon: TimelineIcon,
    isActive: () => useModelStore.getState().viewMode === 'wireframe',
    handler: () => setViewMode('wireframe'),
  },
  {
    id: 'view.real',
    labelKey: 'viewMode.real',
    tooltipKey: 'commands.view.real.tooltip',
    icon: ViewInArIcon,
    isActive: () => useModelStore.getState().viewMode === 'real',
    handler: () => setViewMode('real'),
  },
  {
    id: 'view.loads',
    labelKey: 'viewMode.loads',
    tooltipKey: 'commands.view.loads.tooltip',
    icon: TrendingUpIcon,
    isActive: () => useModelStore.getState().viewMode === 'loads',
    handler: () => setViewMode('loads'),
  },
  {
    id: 'view.restraints',
    labelKey: 'viewMode.restraints',
    tooltipKey: 'commands.view.restraints.tooltip',
    icon: LockIcon,
    isActive: () => useModelStore.getState().viewMode === 'restraints',
    handler: () => setViewMode('restraints'),
  },
  {
    id: 'view.stressMap',
    labelKey: 'viewMode.stress-map',
    tooltipKey: 'commands.view.stressMap.tooltip',
    icon: CropSquareIcon,
    isActive: () => useModelStore.getState().viewMode === 'stress-map',
    handler: () => setViewMode('stress-map'),
  },
  {
    id: 'visibility.axes',
    labelKey: 'visibility.axes',
    tooltipKey: 'commands.visibility.axes.tooltip',
    icon: NorthEastIcon,
    isActive: () => useModelStore.getState().visibility.axes,
    handler: () => toggleVisibility('axes'),
  },
  {
    id: 'visibility.grid',
    labelKey: 'visibility.grid',
    tooltipKey: 'commands.visibility.grid.tooltip',
    icon: GridOnIcon,
    isActive: () => useModelStore.getState().visibility.grid,
    handler: () => toggleVisibility('grid'),
  },
  {
    id: 'visibility.loads',
    labelKey: 'visibility.loads',
    tooltipKey: 'commands.visibility.loads.tooltip',
    icon: TrendingUpIcon,
    isActive: () => useModelStore.getState().visibility.loads,
    handler: () => toggleVisibility('loads'),
  },
  {
    id: 'visibility.restraints',
    labelKey: 'visibility.restraints',
    tooltipKey: 'commands.visibility.restraints.tooltip',
    icon: LockIcon,
    isActive: () => useModelStore.getState().visibility.restraints,
    handler: () => toggleVisibility('restraints'),
  },
  {
    id: 'visibility.labels',
    labelKey: 'visibility.labels',
    tooltipKey: 'commands.visibility.labels.tooltip',
    icon: TextFieldsIcon,
    isActive: () => useModelStore.getState().visibility.labels,
    handler: () => toggleVisibility('labels'),
  },
  {
    id: 'catalog.constructions',
    labelKey: 'commands.catalog.constructions.label',
    tooltipKey: 'commands.catalog.constructions.tooltip',
    icon: DomainIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Каталог конструкций зарезервирован.', 'Structures catalog is reserved.'),
        [
          localize(
            language,
            'Будущий backend-атлас типовых опор и конструкций будет хранить типовые нагрузки и параметры, но в этой frontend-итерации не реализуется.',
            'A future backend atlas of typical structures will store typical loads and parameters, but it is not implemented in this frontend iteration.',
          ),
        ],
      );
    },
  },
  {
    id: 'catalog.profiles',
    labelKey: 'commands.catalog.profiles.label',
    tooltipKey: 'commands.catalog.profiles.tooltip',
    icon: TableRowsIcon,
    handler: () => openProjectProfilesCatalog(),
  },
  {
    id: 'catalog.materials',
    labelKey: 'commands.catalog.materials.label',
    tooltipKey: 'commands.catalog.materials.tooltip',
    icon: LayersIcon,
    handler: () => openProjectMaterialsCatalog(),
  },
  {
    id: 'catalog.profileCatalog',
    labelKey: 'commands.catalog.profileCatalog.label',
    tooltipKey: 'commands.catalog.profileCatalog.tooltip',
    icon: TableRowsIcon,
    placeholder: true,
    handler: () => notifyPlaceholder('commands.catalog.profileCatalog.label'),
  },
  {
    id: 'catalog.materialCatalog',
    labelKey: 'commands.catalog.materialCatalog.label',
    tooltipKey: 'commands.catalog.materialCatalog.tooltip',
    icon: LayersIcon,
    placeholder: true,
    handler: () => notifyPlaceholder('commands.catalog.materialCatalog.label'),
  },
  {
    id: 'analytics.console',
    labelKey: 'commands.analytics.console.label',
    tooltipKey: 'commands.analytics.console.tooltip',
    icon: TerminalIcon,
    hotkey: 'Ctrl+Shift+P',
    isActive: () => useCommandConsoleStore.getState().isDockedOpen,
    handler: (context) => context.openConsole?.(),
  },
  {
    id: 'analytics.wind',
    labelKey: 'commands.analytics.wind.label',
    tooltipKey: 'commands.analytics.wind.tooltip',
    icon: AirIcon,
    handler: () => openManualWindEditor(),
  },
  {
    id: 'analytics.summary',
    labelKey: 'commands.analytics.summary.label',
    tooltipKey: 'commands.analytics.summary.tooltip',
    icon: SummarizeIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Сводка аналитики пока недоступна.', 'Analytics summary is not available yet.'),
        [
          localize(
            language,
            'Отдельная сводка по активному загружению и результатам расчета будет добавлена следующей аналитической итерацией.',
            'A dedicated summary for the active load case and analysis results will be added in a later analytics iteration.',
          ),
        ],
      );
    },
  },
  {
    id: 'report.specification',
    labelKey: 'commands.report.specification.label',
    tooltipKey: 'commands.report.specification.tooltip',
    icon: ListAltIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Спецификация пока не реализована.', 'Specification is not implemented yet.'),
        [
          localize(
            language,
            'Из текущей модели можно собрать простую ведомость позже, но отдельная задача на это еще не выполнена.',
            'A simple schedule can be assembled from the current model later, but that task has not been completed yet.',
          ),
        ],
      );
    },
  },
  {
    id: 'report.calcReport',
    labelKey: 'commands.report.calcReport.label',
    tooltipKey: 'commands.report.calcReport.tooltip',
    icon: ReceiptLongIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Отчет по расчету недоступен.', 'Calculation report is unavailable.'),
        [
          localize(
            language,
            'Отчет появится после интеграции расчетных результатов и backend-слоя.',
            'The calculation report will be available after analysis results and the backend layer are integrated.',
          ),
        ],
      );
    },
  },
  {
    id: 'about.help',
    labelKey: 'commands.about.help.label',
    tooltipKey: 'commands.about.help.tooltip',
    icon: HelpOutlineOutlinedIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Справка пока недоступна.', 'Help is not available yet.'),
        [
          localize(
            language,
            'Контент справки будет добавлен отдельной документационной задачей.',
            'Help content will be added in a separate documentation task.',
          ),
        ],
      );
    },
  },
  {
    id: 'about.license',
    labelKey: 'commands.about.license.label',
    tooltipKey: 'commands.about.license.tooltip',
    icon: GavelIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Сведения о лицензии пока недоступны.', 'License details are not available yet.'),
        [
          localize(
            language,
            'Лицензионная страница будет добавлена после утверждения состава поставки.',
            'The license page will be added after the distribution package is finalized.',
          ),
        ],
      );
    },
  },
  {
    id: 'about.about',
    labelKey: 'commands.about.about.label',
    tooltipKey: 'commands.about.about.tooltip',
    icon: InfoOutlinedIcon,
    placeholder: true,
    handler: () => {
      const language = useUiStore.getState().language;

      notifyReservedFeature(
        localize(language, 'Сведения о приложении пока недоступны.', 'About information is not available yet.'),
        [
          localize(
            language,
            'Раздел About будет заполнен, когда стабилизируется состав frontend и backend модулей.',
            'The About section will be filled in once the frontend and backend module set stabilizes.',
          ),
        ],
      );
    },
  },
  {
    id: 'language.ru',
    labelKey: 'commands.langRu.label',
    tooltipKey: 'commands.langRu.tooltip',
    icon: TerminalIcon,
    handler: () => applyLanguage('ru'),
  },
  {
    id: 'language.en',
    labelKey: 'commands.langEn.label',
    tooltipKey: 'commands.langEn.tooltip',
    icon: TerminalIcon,
    handler: () => applyLanguage('en'),
  },
];

export const CONSOLE_COMMANDS: AppConsoleCommandDefinition[] = [
  {
    id: 'console.help',
    names: ['help'],
    syntax: 'help [command]',
    parameters: ['[command]: optional command name or alias'],
    examples: ['help', 'help view.set', 'help debug.importMeta'],
    execute: (args, context) =>
      args.length === 0
        ? buildConsoleHelpOverview(context.language)
        : buildConsoleCommandHelp(args[0], context.language),
  },
  {
    id: 'console.clear',
    names: ['clear'],
    syntax: 'clear',
    examples: ['clear'],
    execute: () => ({
      severity: 'info',
      clearLog: true,
      lines: [],
    }),
  },
  {
    id: 'view.fit',
    names: ['fit', 'view.fit'],
    syntax: 'fit',
    parameters: [],
    examples: ['fit', 'view.fit'],
    execute: (args, context) => {
      if (args.length > 0) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Лишние аргументы.', 'Unexpected arguments.'),
          lines: ['fit'],
          notify: true,
        };
      }

      const executed = APP_COMMANDS_BY_ID.get('view.fit')?.isDisabled?.() !== true
        && useModelStore.getState().model.nodes.length > 0;

      if (!executed) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Модель пуста.', 'Model is empty.'),
          lines: [
            localize(
              context.language,
              'Fit недоступен, пока в модели нет узлов.',
              'Fit is unavailable while the model has no nodes.',
            ),
          ],
          notify: true,
        };
      }

      useModelStore.getState().requestFitToModel();

      return {
        severity: 'info',
        title: localize(context.language, 'Fit выполнен.', 'Fit executed.'),
        lines: [
          localize(
            context.language,
            'Камера будет подогнана под текущую модель.',
            'The camera will fit the current model bounds.',
          ),
        ],
      };
    },
  },
  {
    id: 'view.set',
    names: ['view.set'],
    syntax: 'view.set <mode>',
    parameters: ['<mode>: wireframe | real | loads | restraints | stress-map'],
    examples: ['view.set wireframe', 'view.set loads'],
    execute: (args, context) => {
      const viewMode = args[0];

      if (viewMode == null || !isActiveViewMode(viewMode)) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неверный режим.', 'Invalid view mode.'),
          lines: [ACTIVE_VIEW_MODES.join(' | ')],
          notify: true,
        };
      }

      setViewMode(viewMode);

      return {
        severity: 'success',
        title: localize(context.language, 'Режим вида изменён.', 'View mode updated.'),
        lines: [viewMode],
      };
    },
  },
  {
    id: 'visibility.set',
    names: ['visibility.set'],
    syntax: 'visibility.set <key> <true|false>',
    parameters: ['<key>: axes | grid | loads | restraints', '<true|false>: boolean flag'],
    examples: ['visibility.set axes false', 'visibility.set loads true'],
    execute: (args, context) => {
      const key = args[0] as typeof VISIBILITY_KEYS[number] | undefined;
      const value = args[1] == null ? null : parseBooleanArgument(args[1]);

      if (key == null || !VISIBILITY_KEYS.includes(key)) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неизвестный visibility key.', 'Unknown visibility key.'),
          lines: ['axes | grid | loads | restraints'],
          notify: true,
        };
      }

      if (value == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неверное boolean-значение.', 'Invalid boolean value.'),
          lines: ['true | false'],
          notify: true,
        };
      }

      setVisibilityValue(key, value);

      return {
        severity: 'success',
        title: localize(context.language, 'Видимость обновлена.', 'Visibility updated.'),
        lines: [`${key} = ${String(value)}`],
        notify: true,
      };
    },
  },
  {
    id: 'model.validate',
    names: ['model.validate'],
    syntax: 'model.validate',
    examples: ['model.validate'],
    execute: (_args, context) => {
      const report = validateCurrentModel();
      const severity = report.errors.length > 0 ? 'error' : report.warnings.length > 0 ? 'warning' : 'success';

      return {
        severity,
        title: localize(
          context.language,
          report.errors.length > 0
            ? 'Проверка модели завершилась с ошибками.'
            : report.warnings.length > 0
              ? 'Проверка модели завершилась с предупреждениями.'
              : 'Проверка модели пройдена.',
          report.errors.length > 0
            ? 'Model validation completed with errors.'
            : report.warnings.length > 0
              ? 'Model validation completed with warnings.'
              : 'Model validation passed.',
        ),
        lines: buildValidationLines(context.language),
        notify: true,
      };
    },
  },
  {
    id: 'model.resetSample',
    names: ['model.resetSample'],
    syntax: 'model.resetSample',
    examples: ['model.resetSample'],
    execute: (_args, context) => {
      const model = resetCurrentModel();

      return {
        severity: 'success',
        title: localize(context.language, 'Тестовая модель восстановлена.', 'Sample model restored.'),
        lines: [
          `${localize(context.language, 'Имя модели', 'Model name')}: ${model.name}`,
          ...buildModelSummaryLines(context.language),
        ],
        notify: true,
      };
    },
  },
  {
    id: 'model.importJson',
    names: ['model.importJson'],
    syntax: 'model.importJson',
    examples: ['model.importJson'],
    execute: (_args, context) => ({
      severity: 'info',
      title: localize(context.language, 'Импорт JSON зарезервирован.', 'JSON import is reserved.'),
      lines: [
        localize(
          context.language,
          'Для выбора файла используйте кнопку Import JSON в ribbon.',
          'Use the Import JSON ribbon command to choose a file.',
        ),
      ],
      notify: true,
    }),
  },
  {
    id: 'model.exportJson',
    names: ['model.exportJson'],
    syntax: 'model.exportJson',
    examples: ['model.exportJson'],
    execute: (_args, context) => {
      const result = exportCurrentModel(context.language);

      return result.ok
        ? {
          severity: 'success',
          title: localize(context.language, 'JSON экспортирован.', 'JSON exported.'),
          lines: [result.fileName],
        }
        : {
          severity: 'error',
          title: localize(context.language, 'Экспорт JSON завершился ошибкой.', 'JSON export failed.'),
          lines: [result.error],
        };
    },
  },
  {
    id: 'dxf.import',
    names: ['dxf.import'],
    syntax: 'dxf.import',
    examples: ['dxf.import'],
    execute: (_args, context) => {
      if (context.openDxfDialog != null) {
        context.openDxfDialog();

        return {
          severity: 'info',
          title: localize(context.language, 'Диалог DXF открыт.', 'DXF dialog opened.'),
          lines: [],
        };
      }

      return {
        severity: 'info',
        title: localize(context.language, 'Импорт DXF вызывается из ribbon.', 'DXF import is triggered from the ribbon.'),
        lines: [
          localize(
            context.language,
            'Откройте Import DXF в ribbon, чтобы выбрать файл и просмотреть preview.',
            'Use the Import DXF ribbon command to choose a file and inspect the preview.',
          ),
        ],
        notify: true,
      };
    },
  },
  {
    id: 'dxf.settings',
    names: ['dxf.settings'],
    syntax: 'dxf.settings [reset]',
    parameters: ['[reset]: restore DXF import defaults'],
    examples: ['dxf.settings', 'dxf.settings reset'],
    execute: (args, context) => {
      const action = args[0]?.toLowerCase();

      if (action == null) {
        return {
          severity: 'info',
          title: localize(context.language, 'Текущие настройки DXF', 'Current DXF settings'),
          lines: buildDxfSettingsLines(),
        };
      }

      if (action === 'reset') {
        resetDxfSettingsToDefaults();

        return {
          severity: 'success',
          title: localize(context.language, 'Настройки DXF сброшены.', 'DXF settings reset.'),
          lines: buildDxfSettingsLines(),
          notify: true,
        };
      }

      return {
        severity: 'warning',
        title: localize(context.language, 'Неизвестное действие.', 'Unknown action.'),
        lines: ['dxf.settings [reset]'],
        notify: true,
      };
    },
  },
  {
    id: 'dxf.tolerance',
    names: ['dxf.tolerance'],
    syntax: 'dxf.tolerance <number>',
    parameters: ['<number>: positive tolerance in mm'],
    examples: ['dxf.tolerance 1', 'dxf.tolerance 0.5'],
    execute: (args, context) => {
      const rawValue = args[0];

      if (rawValue == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['dxf.tolerance <number>'],
          notify: true,
        };
      }

      const value = parseFiniteNumberArgument(rawValue);

      if (value == null || value <= 0) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неверное число.', 'Invalid number.'),
          lines: [rawValue],
          notify: true,
        };
      }

      useModelStore.getState().updateDxfImportSettings({ toleranceMm: value });

      return {
        severity: 'success',
        title: localize(context.language, 'Допуск DXF обновлен.', 'DXF tolerance updated.'),
        lines: buildDxfSettingsLines(),
        notify: true,
      };
    },
  },
  {
    id: 'dxf.center',
    names: ['dxf.center'],
    syntax: 'dxf.center <on|off>',
    parameters: ['<on|off>: toggle centerOnXY'],
    examples: ['dxf.center on', 'dxf.center off'],
    execute: (args, context) => {
      const rawValue = args[0];

      if (rawValue == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['dxf.center <on|off>'],
          notify: true,
        };
      }

      const value = parseOnOffArgument(rawValue);

      if (value == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неверное значение.', 'Invalid value.'),
          lines: ['on | off'],
          notify: true,
        };
      }

      useModelStore.getState().updateDxfImportSettings({ centerOnXY: value });

      return {
        severity: 'success',
        title: localize(context.language, 'Параметр centerOnXY обновлен.', 'centerOnXY updated.'),
        lines: buildDxfSettingsLines(),
        notify: true,
      };
    },
  },
  {
    id: 'dxf.force2d',
    names: ['dxf.force2d'],
    syntax: 'dxf.force2d <on|off>',
    parameters: ['<on|off>: toggle force2DToXY'],
    examples: ['dxf.force2d on', 'dxf.force2d off'],
    execute: (args, context) => {
      const rawValue = args[0];

      if (rawValue == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['dxf.force2d <on|off>'],
          notify: true,
        };
      }

      const value = parseOnOffArgument(rawValue);

      if (value == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неверное значение.', 'Invalid value.'),
          lines: ['on | off'],
          notify: true,
        };
      }

      useModelStore.getState().updateDxfImportSettings({ force2DToXY: value });

      return {
        severity: 'success',
        title: localize(context.language, 'Параметр force2DToXY обновлен.', 'force2DToXY updated.'),
        lines: buildDxfSettingsLines(),
        notify: true,
      };
    },
  },
  {
    id: 'settings.show',
    names: ['settings.show'],
    syntax: 'settings.show',
    examples: ['settings.show'],
    execute: (_args, context) => ({
      severity: 'info',
      title: localize(context.language, 'Текущие настройки', 'Current settings'),
      lines: buildSettingsShowLines(context.language),
    }),
  },
  {
    id: 'theme',
    names: ['theme'],
    syntax: 'theme <light|dark|toggle|status>',
    parameters: ['<light|dark|toggle|status>: theme mode action'],
    examples: ['theme status', 'theme dark', 'theme light', 'theme toggle'],
    execute: (args, context) => {
      const action = args[0]?.toLowerCase();

      if (action == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['theme <light|dark|toggle|status>'],
          notify: true,
        };
      }

      if (action === 'status') {
        const themeMode = useUiStore.getState().themeMode;

        return {
          severity: 'info',
          title: localize(context.language, 'Текущая тема', 'Current theme'),
          lines: [`theme = ${themeMode} (${getThemeModeLabel(context.language, themeMode)})`],
        };
      }

      if (action === 'toggle') {
        const nextThemeMode = toggleThemeMode();

        return {
          severity: 'success',
          title: localize(context.language, 'Тема переключена.', 'Theme toggled.'),
          lines: [`theme = ${nextThemeMode} (${getThemeModeLabel(context.language, nextThemeMode)})`],
          notify: true,
        };
      }

      if (action === 'light' || action === 'dark') {
        applyThemeMode(action);

        return {
          severity: 'success',
          title: localize(context.language, 'Тема обновлена.', 'Theme updated.'),
          lines: [`theme = ${action} (${getThemeModeLabel(context.language, action)})`],
          notify: true,
        };
      }

      return {
        severity: 'warning',
        title: localize(context.language, 'Неизвестная тема.', 'Unknown theme mode.'),
        lines: ['light | dark | toggle | status'],
        notify: true,
      };
    },
  },
  {
    id: 'settings.set',
    names: ['settings.set'],
    syntax: 'settings.set <path> <value>',
    parameters: [
      '<path>: nodeMergeToleranceMm | centerModelByXYProjection | language | panel.projectTree.width | panel.properties.width | visibility.axes | visibility.grid | visibility.loads | visibility.restraints',
      '<value>: number | true | false | ru | en',
    ],
    examples: [
      'settings.set nodeMergeToleranceMm 2',
      'settings.set centerModelByXYProjection false',
      'settings.set language en',
      'settings.set panel.projectTree.width 320',
      'settings.set visibility.grid false',
    ],
    execute: (args, context) => {
      const path = args[0];
      const rawValue = args[1];

      if (path == null || rawValue == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['settings.set <path> <value>'],
          notify: true,
        };
      }

      switch (path) {
        case 'nodeMergeToleranceMm': {
          const value = parseFiniteNumberArgument(rawValue);

          if (value == null || value <= 0) {
            return {
              severity: 'warning',
              title: localize(context.language, 'Неверное число.', 'Invalid number.'),
              lines: [rawValue],
              notify: true,
            };
          }

          const result = useModelStore.getState().updateModelSettings({
            nodeMergeToleranceMm: value,
          });

          return result.ok
            ? {
              severity: 'success',
              title: localize(context.language, 'Настройка обновлена.', 'Setting updated.'),
              lines: [`nodeMergeToleranceMm = ${value}`],
              notify: true,
            }
            : {
              severity: 'error',
              title: localize(context.language, 'Не удалось обновить настройку.', 'Failed to update setting.'),
              lines: [result.error],
              notify: true,
            };
        }
        case 'centerModelByXYProjection': {
          const value = parseBooleanArgument(rawValue);

          if (value == null) {
            return {
              severity: 'warning',
              title: localize(context.language, 'Неверное boolean-значение.', 'Invalid boolean value.'),
              lines: ['true | false'],
              notify: true,
            };
          }

          const result = useModelStore.getState().updateModelSettings({
            centerModelByXYProjection: value,
          });

          return result.ok
            ? {
              severity: 'success',
              title: localize(context.language, 'Настройка обновлена.', 'Setting updated.'),
              lines: [`centerModelByXYProjection = ${String(value)}`],
              notify: true,
            }
            : {
              severity: 'error',
              title: localize(context.language, 'Не удалось обновить настройку.', 'Failed to update setting.'),
              lines: [result.error],
              notify: true,
            };
        }
        case 'language': {
          if (rawValue !== 'ru' && rawValue !== 'en') {
            return {
              severity: 'warning',
              title: localize(context.language, 'Неизвестный язык.', 'Unknown language.'),
              lines: ['ru | en'],
              notify: true,
            };
          }

          applyLanguage(rawValue);

          return {
            severity: 'success',
            title: localize(context.language, 'Язык интерфейса обновлён.', 'Interface language updated.'),
            lines: [rawValue],
          };
        }
        case 'panel.projectTree.width': {
          const value = parseFiniteNumberArgument(rawValue);

          if (value == null) {
            return {
              severity: 'warning',
              title: localize(context.language, 'Неверное число.', 'Invalid number.'),
              lines: [rawValue],
              notify: true,
            };
          }

          useLayoutStore.getState().setProjectTreeWidth(value);

          return {
            severity: 'success',
            title: localize(context.language, 'Ширина панели обновлена.', 'Panel width updated.'),
            lines: [`panel.projectTree.width = ${useLayoutStore.getState().projectTreeWidth}`],
            notify: true,
          };
        }
        case 'panel.properties.width': {
          const value = parseFiniteNumberArgument(rawValue);

          if (value == null) {
            return {
              severity: 'warning',
              title: localize(context.language, 'Неверное число.', 'Invalid number.'),
              lines: [rawValue],
              notify: true,
            };
          }

          useLayoutStore.getState().setPropertiesWidth(value);

          return {
            severity: 'success',
            title: localize(context.language, 'Ширина панели обновлена.', 'Panel width updated.'),
            lines: [`panel.properties.width = ${useLayoutStore.getState().propertiesWidth}`],
            notify: true,
          };
        }
        case 'visibility.axes':
        case 'visibility.grid':
        case 'visibility.loads':
        case 'visibility.restraints': {
          const value = parseBooleanArgument(rawValue);

          if (value == null) {
            return {
              severity: 'warning',
              title: localize(context.language, 'Неверное boolean-значение.', 'Invalid boolean value.'),
              lines: ['true | false'],
              notify: true,
            };
          }

          const key = path.replace('visibility.', '') as typeof VISIBILITY_KEYS[number];
          setVisibilityValue(key, value);

          return {
            severity: 'success',
            title: localize(context.language, 'Видимость обновлена.', 'Visibility updated.'),
            lines: [`${path} = ${String(value)}`],
            notify: true,
          };
        }
        case 'verticalAxis':
        case 'model.settings.verticalAxis':
          return {
            severity: 'warning',
            title: localize(context.language, 'Настройка только для чтения.', 'Read-only setting.'),
            lines: [
              localize(
                context.language,
                'verticalAxis фиксирован как Z и не меняется в этой итерации.',
                'verticalAxis is fixed to Z in this iteration.',
              ),
            ],
            notify: true,
          };
        default:
          return {
            severity: 'warning',
            title: localize(context.language, 'Неизвестный путь настройки.', 'Unknown setting path.'),
            lines: [path],
            notify: true,
          };
      }
    },
  },
  {
    id: 'lang',
    names: ['lang'],
    syntax: 'lang <ru|en>',
    parameters: ['<ru|en>: interface language'],
    examples: ['lang ru', 'lang en'],
    execute: (args, context) => {
      const language = args[0];

      if (language !== 'ru' && language !== 'en') {
        return {
          severity: 'warning',
          title: localize(context.language, 'Неизвестный язык.', 'Unknown language.'),
          lines: ['ru | en'],
          notify: true,
        };
      }

      applyLanguage(language);

      return {
        severity: 'success',
        title: localize(context.language, 'Язык интерфейса обновлён.', 'Interface language updated.'),
        lines: [language],
      };
    },
  },
  {
    id: 'select.node',
    names: ['select.node'],
    syntax: 'select.node <nodeId>',
    parameters: ['<nodeId>: node id'],
    examples: ['select.node N1'],
    execute: (args, context) => {
      const nodeId = args[0];

      if (nodeId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не указан nodeId.', 'nodeId is missing.'),
          lines: ['select.node <nodeId>'],
          notify: true,
        };
      }

      const node = useModelStore.getState().model.nodes.find((candidate) => candidate.id === nodeId);
      if (node == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Узел не найден.', 'Node not found.'),
          lines: [nodeId],
          notify: true,
        };
      }

      useModelStore.getState().selectEntity({ type: 'node', id: nodeId });

      return {
        severity: 'info',
        title: localize(context.language, 'Узел выбран.', 'Node selected.'),
        lines: [nodeId],
      };
    },
  },
  {
    id: 'select.member',
    names: ['select.member'],
    syntax: 'select.member <memberId>',
    parameters: ['<memberId>: member id'],
    examples: ['select.member M-1'],
    execute: (args, context) => {
      const memberId = args[0];

      if (memberId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не указан memberId.', 'memberId is missing.'),
          lines: ['select.member <memberId>'],
          notify: true,
        };
      }

      const member = useModelStore.getState().model.members.find((candidate) => candidate.id === memberId);
      if (member == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Элемент не найден.', 'Member not found.'),
          lines: [memberId],
          notify: true,
        };
      }

      useModelStore.getState().selectEntity({ type: 'member', id: memberId });

      return {
        severity: 'info',
        title: localize(context.language, 'Элемент выбран.', 'Member selected.'),
        lines: [memberId],
      };
    },
  },
  {
    id: 'select.load',
    names: ['select.load'],
    syntax: 'select.load <loadCaseId> <loadId>',
    parameters: ['<loadCaseId>: load case id', '<loadId>: load id'],
    examples: ['select.load LC1 load-1'],
    execute: (args, context) => {
      const loadCaseId = args[0];
      const loadId = args[1];

      if (loadCaseId == null || loadId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['select.load <loadCaseId> <loadId>'],
          notify: true,
        };
      }

      const loadCase = useModelStore.getState().model.loadCases.find((candidate) => candidate.id === loadCaseId);
      const load = loadCase?.loads.find((candidate) => candidate.id === loadId);

      if (loadCase == null || load == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Нагрузка не найдена.', 'Load not found.'),
          lines: [`${loadCaseId} / ${loadId}`],
          notify: true,
        };
      }

      useModelStore.getState().selectLoad(loadCaseId, loadId);

      return {
        severity: 'info',
        title: localize(context.language, 'Нагрузка выбрана.', 'Load selected.'),
        lines: [`${loadCaseId} / ${loadId}`],
      };
    },
  },
  {
    id: 'debug.selection',
    names: ['debug.selection'],
    syntax: 'debug.selection',
    examples: ['debug.selection'],
    execute: (_args, context) => {
      const selectedEntity = useModelStore.getState().selectedEntity;
      const label = getSelectedEntityLabel(selectedEntity);

      return {
        severity: 'info',
        title: localize(context.language, 'Текущий выбор', 'Current selection'),
        lines: label == null
          ? [localize(context.language, 'Выбор отсутствует.', 'Selection is empty.')]
          : buildDebugEntityLines(selectedEntity),
      };
    },
  },
  {
    id: 'debug.model.summary',
    names: ['debug.model.summary'],
    syntax: 'debug.model.summary',
    examples: ['debug.model.summary'],
    execute: (_args, context) => ({
      severity: 'info',
      title: localize(context.language, 'Сводка модели', 'Model summary'),
      lines: buildModelSummaryLines(context.language),
    }),
  },
  {
    id: 'debug.node',
    names: ['debug.node'],
    syntax: 'debug.node <nodeId>',
    parameters: ['<nodeId>: node id'],
    examples: ['debug.node N1'],
    execute: (args, context) => {
      const nodeId = args[0];

      if (nodeId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не указан nodeId.', 'nodeId is missing.'),
          lines: ['debug.node <nodeId>'],
          notify: true,
        };
      }

      const node = useModelStore.getState().model.nodes.find((candidate) => candidate.id === nodeId);
      if (node == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Узел не найден.', 'Node not found.'),
          lines: [nodeId],
          notify: true,
        };
      }

      return {
        severity: 'info',
        title: `${localize(context.language, 'Узел', 'Node')} ${nodeId}`,
        lines: buildDebugEntityLines(node),
      };
    },
  },
  {
    id: 'debug.member',
    names: ['debug.member'],
    syntax: 'debug.member <memberId>',
    parameters: ['<memberId>: member id'],
    examples: ['debug.member M-1'],
    execute: (args, context) => {
      const memberId = args[0];

      if (memberId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не указан memberId.', 'memberId is missing.'),
          lines: ['debug.member <memberId>'],
          notify: true,
        };
      }

      const member = useModelStore.getState().model.members.find((candidate) => candidate.id === memberId);
      if (member == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Элемент не найден.', 'Member not found.'),
          lines: [memberId],
          notify: true,
        };
      }

      return {
        severity: 'info',
        title: `${localize(context.language, 'Элемент', 'Member')} ${memberId}`,
        lines: buildDebugEntityLines(member),
      };
    },
  },
  {
    id: 'debug.load',
    names: ['debug.load'],
    syntax: 'debug.load <loadCaseId> <loadId>',
    parameters: ['<loadCaseId>: load case id', '<loadId>: load id'],
    examples: ['debug.load LC1 load-1'],
    execute: (args, context) => {
      const loadCaseId = args[0];
      const loadId = args[1];

      if (loadCaseId == null || loadId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не хватает аргументов.', 'Missing arguments.'),
          lines: ['debug.load <loadCaseId> <loadId>'],
          notify: true,
        };
      }

      const loadCase = useModelStore.getState().model.loadCases.find((candidate) => candidate.id === loadCaseId);
      const load = loadCase?.loads.find((candidate) => candidate.id === loadId);

      if (loadCase == null || load == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Нагрузка не найдена.', 'Load not found.'),
          lines: [`${loadCaseId} / ${loadId}`],
          notify: true,
        };
      }

      return {
        severity: 'info',
        title: `${localize(context.language, 'Нагрузка', 'Load')} ${loadId}`,
        lines: buildDebugEntityLines({
          loadCaseId,
          load,
        }),
      };
    },
  },
  {
    id: 'debug.source.member',
    names: ['debug.source.member'],
    syntax: 'debug.source.member <memberId>',
    parameters: ['<memberId>: member id'],
    examples: ['debug.source.member M-1'],
    execute: (args, context) => {
      const memberId = args[0];

      if (memberId == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Не указан memberId.', 'memberId is missing.'),
          lines: ['debug.source.member <memberId>'],
          notify: true,
        };
      }

      const member = useModelStore.getState().model.members.find((candidate) => candidate.id === memberId);
      if (member == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'Элемент не найден.', 'Member not found.'),
          lines: [memberId],
          notify: true,
        };
      }

      if (member.source == null) {
        return {
          severity: 'warning',
          title: localize(context.language, 'DXF source отсутствует.', 'DXF source is not available.'),
          lines: [memberId],
          notify: true,
        };
      }

      return {
        severity: 'info',
        title: `${localize(context.language, 'Источник элемента', 'Member source')} ${memberId}`,
        lines: buildDebugEntityLines(member.source),
      };
    },
  },
  {
    id: 'debug.importMeta',
    names: ['debug.importMeta'],
    syntax: 'debug.importMeta',
    examples: ['debug.importMeta'],
    execute: (_args, context) => ({
      severity: 'info',
      title: localize(context.language, 'Метаданные импорта', 'Import metadata'),
      lines: buildImportMetaLines(context.language),
    }),
  },
  {
    id: 'db.help',
    names: ['db.help'],
    syntax: 'db.help',
    examples: ['db.help'],
    execute: (_args, context) => ({
      severity: 'info',
      title: localize(context.language, 'DB-команды зарезервированы.', 'DB commands are reserved.'),
      lines: [
        localize(
          context.language,
          'В этой frontend-итерации база данных не реализуется.',
          'Database commands are reserved for a future backend iteration.',
        ),
      ],
    }),
  },
  {
    id: 'structures.help',
    names: ['structures.help'],
    syntax: 'structures.help',
    examples: ['structures.help'],
    execute: (_args, context) => ({
      severity: 'info',
      title: localize(context.language, 'Каталог конструкций зарезервирован.', 'Structures catalog is reserved.'),
      lines: [
        localize(
          context.language,
          'Каталог типовых опор и конструкций позже станет backend-сущностью.',
          'The structures catalog will become a backend entity later.',
        ),
      ],
    }),
  },
];

export const APP_COMMANDS_BY_ID = new Map(APP_COMMANDS.map((command) => [command.id, command] as const));

export const RIBBON_COMMAND_GROUPS: RibbonCommandGroupDefinition[] = [
  {
    id: 'document',
    titleKey: 'ribbon.group.document',
    primaryCommandIds: ['document.openProject', 'document.saveProject', 'document.importDxf'],
    menuSecondaryCommandIds: ['document.exportDxf', 'document.importJson', 'document.exportJson'],
  },
  {
    id: 'view',
    titleKey: 'ribbon.group.view',
    primaryCommandIds: ['view.wireframe', 'view.real', 'view.stressMap'],
  },
  {
    id: 'visibility',
    titleKey: 'ribbon.group.visibility',
    primaryCommandIds: ['view.fit', 'visibility.axes', 'visibility.grid'],
    menuSecondaryCommandIds: ['visibility.loads', 'visibility.restraints', 'visibility.labels'],
  },
  {
    id: 'catalog',
    titleKey: 'ribbon.group.catalog',
    primaryCommandIds: ['catalog.constructions'],
    inlineSecondaryCommandIds: ['catalog.profiles', 'catalog.materials'],
    menuSecondaryCommandIds: ['catalog.profileCatalog', 'catalog.materialCatalog'],
  },
  {
    id: 'analytics',
    titleKey: 'ribbon.group.analytics',
    primaryCommandIds: ['analytics.console'],
    inlineSecondaryCommandIds: ['analytics.summary', 'analytics.wind'],
  },
  {
    id: 'report',
    titleKey: 'ribbon.group.report',
    primaryCommandIds: ['report.calcReport', 'report.specification'],
  },
  {
    id: 'about',
    titleKey: 'ribbon.group.about',
    primaryCommandIds: ['about.help'],
    inlineSecondaryCommandIds: ['about.about', 'about.license'],
  },
];
