import { Chart, ChartEvent, registerables } from 'chart.js';
import { MainResponse } from '../types/main-response.js';

async function getResponse(): Promise<MainResponse> {
  const response = await fetch('/data.json');
  return response.json();
}

Chart.register(...registerables);

const element = document.querySelector('#app');

if (!element) {
  throw new Error('app element not found');
}

const devCanvas = document.createElement('canvas');
devCanvas.id = 'dev-dependencies';
const depCanvas = document.createElement('canvas');
depCanvas.id = 'dependencies';
const unsavedCanvas = document.createElement('canvas');
unsavedCanvas.id = 'unsaved-dependencies';

element.append(depCanvas);
element.append(devCanvas);
element.append(unsavedCanvas);

const response = await getResponse();

new Chart(depCanvas, {
  options: {
    plugins: {
      title: {
        display: true,
        text: 'Dependencies',
      },
    },
  },
  type: 'pie',
  data: {
    labels: response.dependencies.dependencies.map((dep) => dep.name),
    datasets: [
      {
        data: response.dependencies.dependencies.map(
          (dep) => dep.totalDependencies,
        ),
        borderWidth: 1,
      },
    ],
  },
});

new Chart(devCanvas, {
  options: {
    plugins: {
      title: {
        display: true,
        text: `Dev Dependencies (${response.devDependencies.totalDependencies})`,
      },
    },
  },
  type: 'pie',
  data: {
    labels: response.devDependencies.dependencies.map(
      (dependency) => dependency.name,
    ),
    datasets: [
      {
        data: response.devDependencies.dependencies.map(
          (dependency) => dependency.totalDependencies,
        ),
        borderWidth: 1,
      },
    ],
  },
  plugins: [
    {
      id: 'load-dependency',
      afterEvent: (
        chart: Chart,
        args: {
          event: ChartEvent;
          replay: boolean;
          changed?: boolean;
          cancelable: false;
          inChartArea: boolean;
        },
      ) => {
        if (args.event.type === 'click') {
          const activeElement = chart.getActiveElements()[0];
          if (!activeElement) {
            return;
          }
          chart.data.labels?.splice(activeElement.index, 1);
          chart.data.datasets[0]?.data.splice(activeElement.index, 1);
          chart.update();
        }
      },
    },
  ],
});

new Chart(unsavedCanvas, {
  options: {
    plugins: {
      title: {
        display: true,
        text: 'Unsaved Dependencies',
      },
    },
  },
  type: 'pie',
  data: {
    labels: response.unsavedDependencies.dependencies.map(
      (dependency) => dependency.name,
    ),
    datasets: [
      {
        data: response.unsavedDependencies.dependencies.map(
          (dependency) => dependency.totalDependencies,
        ),
        borderWidth: 1,
      },
    ],
  },
});
