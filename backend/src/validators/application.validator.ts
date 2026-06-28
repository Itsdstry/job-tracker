import { body, query } from 'express-validator';

const VALID_STATUSES = ['Applied', 'Interview', 'TechnicalTest', 'Offer', 'Rejected'];

export const createApplicationValidator = [
  body('company')
    .trim()
    .notEmpty().withMessage('Company is required')
    .isLength({ max: 100 }).withMessage('Company name too long'),
  body('position')
    .trim()
    .notEmpty().withMessage('Position is required')
    .isLength({ max: 100 }).withMessage('Position name too long'),
  body('salary')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Location too long'),
  body('url')
    .optional({ nullable: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('URL must be a valid http/https URL')
    .isLength({ max: 2000 }).withMessage('URL too long'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Notes too long'),
  body('applicationDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

export const updateApplicationValidator = [
  body('company')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Company name invalid'),
  body('position')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Position name invalid'),
  body('salary')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }),
  body('url')
    .optional({ nullable: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('URL must be a valid http/https URL')
    .isLength({ max: 2000 }).withMessage('URL too long'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }),
  body('applicationDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

export const listApplicationsValidator = [
  query('status').optional().isIn(VALID_STATUSES),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['applicationDate', 'company', 'position', 'createdAt', 'salary']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
];
