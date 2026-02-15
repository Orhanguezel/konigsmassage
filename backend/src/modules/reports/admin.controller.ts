// ===================================================================
// FILE: src/modules/reports/admin.controller.ts
// ===================================================================

import type { RouteHandler } from 'fastify';
import { getKpiData, getUsersPerformanceData, getLocationsData } from './repository';

export const getKpiReportAdmin: RouteHandler = async (req, reply) => {
  const { from, to } = req.query as { from?: string; to?: string };
  try {
    const data = await getKpiData(from, to);
    return reply.send(data);
  } catch (err) {
    req.log.error(err, 'getKpiReportAdmin_failed');
    return reply.code(500).send({ error: { message: 'getKpiReportAdmin_failed' } });
  }
};

export const getUsersPerformanceReportAdmin: RouteHandler = async (req, reply) => {
  const { from, to, role } = req.query as { from?: string; to?: string; role?: string };
  try {
    const data = await getUsersPerformanceData(from, to, role);
    return reply.send(data);
  } catch (err) {
    req.log.error(err, 'getUsersPerformanceReportAdmin_failed');
    return reply.code(500).send({ error: { message: 'getUsersPerformanceReportAdmin_failed' } });
  }
};

export const getLocationsReportAdmin: RouteHandler = async (req, reply) => {
  const { from, to } = req.query as { from?: string; to?: string };
  try {
    const data = await getLocationsData(from, to);
    return reply.send(data);
  } catch (err) {
    req.log.error(err, 'getLocationsReportAdmin_failed');
    return reply.code(500).send({ error: { message: 'getLocationsReportAdmin_failed' } });
  }
};
