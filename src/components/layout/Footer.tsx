'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';

export const Footer: React.FC = () => {
  const { t } = useI18n();
  const { darkMode } = useUIStore();

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`border-t ${
        darkMode
          ? 'bg-gray-900 text-gray-400 border-gray-700'
          : 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-8">
          <div>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('footer.product')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="hover:underline">
                  {t('footer.features')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:underline">
                  {t('footer.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:underline">
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('footer.company')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:underline">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:underline">
                  {t('footer.blog')}
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:underline">
                  {t('footer.careers')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('footer.support')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:underline">
                  {t('layout.help')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:underline">
                  {t('admin.systemHealth')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('footer.legal')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:underline">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:underline">
                  {t('layout.settings')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div
          className={`border-t ${
            darkMode ? 'border-gray-700 pt-8' : 'border-gray-200 pt-8'
          } flex flex-col sm:flex-row justify-between items-center text-sm`}
        >
          <p>{t('footer.copyright', { year: currentYear })}</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:underline">
              Twitter
            </a>
            <a href="#" className="hover:underline">
              LinkedIn
            </a>
            <a href="#" className="hover:underline">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

