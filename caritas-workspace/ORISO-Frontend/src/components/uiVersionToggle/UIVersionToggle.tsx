import * as React from 'react';
import { useState, useEffect } from 'react';
import { Switch, FormControlLabel, Box, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import './uiVersionToggle.styles.scss';

const UI_VERSION_COOKIE = 'ui-version';
const UI_VERSION_STORAGE = 'ui-version';

export const UIVersionToggle = () => {
	const { t } = useTranslation();
	const [useNewUI, setUseNewUI] = useState(() => {
		// Determine current UI based on port
		// Port 8087 = Element (New UI), Port 9001 = Classic UI
		const currentPort = window.location.port;
		
		// If on Element (8087), toggle should be ON
		// If on Classic (9001), toggle should be OFF
		return currentPort === '8087';
	});

	const toggleUI = () => {
		const newVersion = useNewUI ? 'classic' : 'new';
		
		// Save preference
		localStorage.setItem(UI_VERSION_STORAGE, newVersion);
		
		// Set cookie (30 days expiry)
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + 30);
		document.cookie = `${UI_VERSION_COOKIE}=${newVersion}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
		
		// Redirect to Element UI or reload
		if (newVersion === 'new') {
			// Get Matrix credentials from localStorage
			const matrixUserId = localStorage.getItem('matrix_user_id');
			const matrixAccessToken = localStorage.getItem('matrix_access_token');
			const matrixDeviceId = localStorage.getItem('matrix_device_id');
			const currentHost = window.location.hostname;
			const homeserverUrl = `http://${currentHost}:8008`;
			
			if (matrixUserId && matrixAccessToken) {
				// Store Matrix credentials in COOKIES (shared across ports!)
				// Cookies are accessible from both 9001 and 8087
				document.cookie = `matrix_sso_user_id=${encodeURIComponent(matrixUserId)}; path=/; SameSite=Lax`;
				document.cookie = `matrix_sso_access_token=${encodeURIComponent(matrixAccessToken)}; path=/; SameSite=Lax`;
				document.cookie = `matrix_sso_device_id=${encodeURIComponent(matrixDeviceId || '')}; path=/; SameSite=Lax`;
				document.cookie = `matrix_sso_hs_url=${encodeURIComponent(homeserverUrl)}; path=/; SameSite=Lax`;
				
				console.log('✅ Matrix credentials stored in cookies for Element SSO');
				console.log('📍 User ID:', matrixUserId);
				console.log('📍 Homeserver:', homeserverUrl);
				console.log('📍 Device ID:', matrixDeviceId);
			} else {
				console.warn('⚠️ No Matrix credentials found - Element will require manual login');
			}
			
			// Redirect directly to Element
			// Element's auto-login script will read the cookies and auto-login
			const elementPort = '8087';
			window.location.href = `http://${currentHost}:${elementPort}`;
		} else {
			// Reload to Classic UI
			window.location.reload();
		}
	};

	return (
		<Box className="ui-version-toggle" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
			<Chip 
				label="BETA" 
				size="small" 
				color="primary" 
				variant="outlined"
				sx={{ display: useNewUI ? 'none' : 'inline-flex' }}
			/>
			<FormControlLabel
				control={
					<Switch
						checked={useNewUI}
						onChange={toggleUI}
						color="primary"
						size="small"
					/>
				}
				label={
					<span className="ui-version-toggle__label">
						{useNewUI ? t('app.ui.new') : t('app.ui.classic')}
					</span>
				}
				labelPlacement="start"
			/>
		</Box>
	);
};

