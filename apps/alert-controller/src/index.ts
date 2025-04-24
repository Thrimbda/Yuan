import * as k8s from '@kubernetes/client-node';
import { terminal } from './terminal';

// PrometheusRule 接口定义
interface PrometheusRule extends k8s.KubernetesObject {
  apiVersion: 'monitoring.coreos.com/v1';
  kind: 'PrometheusRule';
  metadata: k8s.V1ObjectMeta;
  spec: {
    groups: Array<{
      name: string;
      rules: Array<{
        alert?: string;
        expr: string;
        for?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        record?: string;
      }>;
    }>;
  };
}

// 初始化 Kubernetes 客户端
function initKubeClient(): k8s.KubernetesObjectApi {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const api = k8s.KubernetesObjectApi.makeApiClient(kc);
  return api;
}

// 创建 PrometheusRule
async function createPrometheusRule(namespace: string, rule: PrometheusRule): Promise<PrometheusRule> {
  const k8sClient = initKubeClient();
  const response = await k8sClient.create(rule);
  return response;
}

// 获取单个 PrometheusRule
async function getPrometheusRule(namespace: string, name: string): Promise<PrometheusRule> {
  const k8sClient = initKubeClient();
  const response = await k8sClient.read({
    apiVersion: 'monitoring.coreos.com/v1',
    kind: 'PrometheusRule',
    metadata: {
      name: name,
      namespace: namespace,
    },
  });
  return response as PrometheusRule;
}

// 获取所有 PrometheusRule
async function listPrometheusRules(namespace: string): Promise<PrometheusRule[]> {
  const k8sClient = initKubeClient();
  const response = await k8sClient.list('monitoring.coreos.com/v1', 'PrometheusRule', namespace);
  return response.items as PrometheusRule[];
}

// 更新 PrometheusRule
async function updatePrometheusRule(
  namespace: string,
  name: string,
  rule: PrometheusRule,
): Promise<PrometheusRule> {
  const k8sClient = initKubeClient();
  // 确保 rule 包含正确的名称和命名空间
  rule.metadata = rule.metadata || {};
  rule.metadata.name = name;
  rule.metadata.namespace = namespace;

  const response = await k8sClient.replace(rule);
  return response;
}

// 删除 PrometheusRule
async function deletePrometheusRule(namespace: string, name: string): Promise<void> {
  const k8sClient = initKubeClient();
  await k8sClient.delete({
    apiVersion: 'monitoring.coreos.com/v1',
    kind: 'PrometheusRule',
    metadata: {
      name: name,
      namespace: namespace,
    },
  });
}

(async () => {})();

terminal.provideService(
  'PrometheusRule/get',
  {
    required: ['namespace', 'name'],
    properties: {
      namespace: { type: 'string' },
      name: { type: 'string' },
    },
  },
  async (msg) => {
    const { namespace, name } = msg.req as {
      namespace: string;
      name: string;
    };
    const rule = await getPrometheusRule(namespace, name);
    return {
      res: {
        code: 0,
        message: 'OK',
        data: rule,
      },
    };
  },
);

terminal.provideService(
  'PrometheusRule/list',
  {
    // can we remove namespace?
    required: ['namespace'],
    properties: {
      namespace: { type: 'string' },
    },
  },
  async (msg) => {
    const { namespace } = msg.req as {
      namespace: string;
    };
    const rules = await listPrometheusRules(namespace);
    return {
      res: {
        code: 0,
        message: 'OK',
        data: rules,
      },
    };
  },
);
