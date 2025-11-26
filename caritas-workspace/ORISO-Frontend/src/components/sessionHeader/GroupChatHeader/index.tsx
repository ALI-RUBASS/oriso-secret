import React, { useContext, useState } from 'react';
import { Link, generatePath } from 'react-router-dom';
import {
	AUTHORITIES,
	SessionTypeContext,
	UserDataContext,
	getContact,
	hasUserAuthority,
	useConsultingType,
	ActiveSessionContext
} from '../../../globalState';
import { useSearchParam } from '../../../hooks/useSearchParams';
import {
	SESSION_LIST_TAB,
	SESSION_LIST_TYPES,
	getViewPathForType,
	isUserModerator
} from '../../session/sessionHelpers';
import { isMobile } from 'react-device-detect';
import { mobileListView } from '../../app/navigationHandler';
import {
	BackIcon,
	CameraOnIcon,
	GroupChatInfoIcon
} from '../../../resources/img/icons';
import { ReactComponent as VideoCallIcon } from '../../../resources/img/illustrations/camera.svg';
import { ReactComponent as CallOnIcon } from '../../../resources/img/icons/call-on.svg';
import { SessionMenu } from '../../sessionMenu/SessionMenu';
import { useTranslation } from 'react-i18next';
import { getGroupChatDate } from '../../session/sessionDateHelpers';
import { getValueFromCookie } from '../../sessionCookie/accessSessionCookie';
import { decodeUsername } from '../../../utils/encryptionHelpers';
import { FlyoutMenu } from '../../flyoutMenu/FlyoutMenu';
import { BanUser, BanUserOverlay } from '../../banUser/BanUser';
import { Tag } from '../../tag/Tag';
import { BUTTON_TYPES, Button, ButtonItem } from '../../button/Button';
import { useAppConfig } from '../../../hooks/useAppConfig';
import { RocketChatUsersOfRoomContext } from '../../../globalState/provider/RocketChatUsersOfRoomProvider';
import { SessionItemInterface } from '../../../globalState/interfaces';

interface GroupChatHeaderProps {
	hasUserInitiatedStopOrLeaveRequest: React.MutableRefObject<boolean>;
	isJoinGroupChatView: boolean;
	bannedUsers: string[];
}

export const GroupChatHeader = ({
	hasUserInitiatedStopOrLeaveRequest,
	isJoinGroupChatView,
	bannedUsers
}: GroupChatHeaderProps) => {
	const { releaseToggles } = useAppConfig();

	const [isUserBanOverlayOpen, setIsUserBanOverlayOpen] =
		useState<boolean>(false);
	const { t } = useTranslation(['common', 'consultingTypes', 'agencies']);
	const { activeSession } = useContext(ActiveSessionContext);
	// MATRIX MIGRATION: RocketChatUsersOfRoomContext may be null for Matrix rooms, use fallback
	const rcUsersContext = useContext(RocketChatUsersOfRoomContext);
	const users = rcUsersContext?.users || [];
	const moderators = rcUsersContext?.moderators || [];
	const { userData } = useContext(UserDataContext);
	const { type, path: listPath } = useContext(SessionTypeContext);
	const sessionListTab = useSearchParam<SESSION_LIST_TAB>('sessionListTab');
	const sessionView = getViewPathForType(type);
	const consultingType = useConsultingType(activeSession.item.consultingType);
	const [flyoutOpenId, setFlyoutOpenId] = useState('');
	const isConsultant = hasUserAuthority(
		AUTHORITIES.CONSULTANT_DEFAULT,
		userData
	);
	
	// Use CallManager for group calls (same as SessionMenu)
	const handleStartVideoCall = async (isVideoActivated: boolean = true) => {
		console.log("═══════════════════════════════════════════════");
		console.log("🎬 GROUP CALL BUTTON CLICKED (GroupChatHeader)!");
		console.log("═══════════════════════════════════════════════");
		
		try {
			const roomId = activeSession.item.matrixRoomId || activeSession.item.groupId;
			
			if (!roomId) {
				console.error('❌ No Matrix room ID found for session');
				alert('Cannot start call: No Matrix room found for this session');
				return;
			}

			// Check HTTPS
			if (window.location.protocol !== 'https:') {
				console.error('❌ Not on HTTPS! Safari requires HTTPS for camera/microphone access');
				const httpsUrl = window.location.href.replace('http://', 'https://');
				if (window.confirm('Camera/microphone access requires HTTPS. Redirect to secure connection?')) {
					window.location.href = httpsUrl;
				}
				return;
			}

			// Request media permissions IMMEDIATELY in click handler
			console.log('🎤 Requesting media permissions (SYNC with user click)...');
			
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: isVideoActivated, 
					audio: true 
				});
				console.log('✅ Media permissions granted!', stream);
				
				// Store stream globally
				(window as any).__preRequestedMediaStream = stream;
				(window as any).__preRequestedMediaStreamTime = Date.now();
			} catch (mediaError: any) {
				console.error('❌ Media permission denied:', mediaError);
				
				let errorMsg = 'Cannot access camera/microphone. ';
				if (mediaError.name === 'NotAllowedError') {
					errorMsg += 'Please grant permissions in your browser settings.';
				} else if (mediaError.name === 'NotFoundError') {
					errorMsg += 'No camera/microphone found on this device.';
				} else if (mediaError.name === 'NotSupportedError') {
					errorMsg += 'Your browser does not support this feature. Please use HTTPS.';
				} else {
					errorMsg += mediaError.message || 'Unknown error.';
				}
				
				alert(errorMsg);
				return;
			}

			console.log('📞 Starting call via CallManager with roomId:', roomId);
			console.log('🎯 This is a GROUP CHAT - forcing isGroup=true');
			
			// Use CallManager (works for both 1-on-1 and group calls!)
			const { callManager } = require('../../../services/CallManager');
			callManager.startCall(roomId, isVideoActivated, true); // Force isGroup=true for group chats
			
			console.log('✅ Call initiated!');
		} catch (error) {
			console.error('💥 ERROR in handleStartVideoCall:', error);
			alert(`Call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
		console.log("═══════════════════════════════════════════════");
	};

	const sessionTabPath = `${
		sessionListTab ? `?sessionListTab=${sessionListTab}` : ''
	}`;

	const isCurrentUserModerator = isUserModerator({
		chatItem: activeSession.item,
		rcUserId: getValueFromCookie('rc_uid')
	});

	const userSessionData = getContact(activeSession)?.sessionData || {};
	const isAskerInfoAvailable = () =>
		!hasUserAuthority(AUTHORITIES.ASKER_DEFAULT, userData) &&
		consultingType?.showAskerProfile &&
		activeSession.isSession &&
		((type === SESSION_LIST_TYPES.ENQUIRY &&
			Object.entries(userSessionData).length !== 0) ||
			SESSION_LIST_TYPES.ENQUIRY !== type);

	const [isSubscriberFlyoutOpen, setIsSubscriberFlyoutOpen] = useState(false);

	const handleFlyout = (e) => {
		if (!isSubscriberFlyoutOpen) {
			setIsSubscriberFlyoutOpen(true);
		} else if (e.target.id === 'subscriberButton') {
			setIsSubscriberFlyoutOpen(false);
		}
	};

	// Voice call button
	const buttonStartCall: ButtonItem = {
		type: BUTTON_TYPES.SMALL_ICON,
		title: t('videoCall.button.startCall'),
		smallIconBackgroundColor: 'grey',
		icon: (
			<CallOnIcon
				title={t('videoCall.button.startCall')}
				aria-label={t('videoCall.button.startCall')}
			/>
		)
	};

	// Video call button
	const buttonStartVideoCall: ButtonItem = {
		type: BUTTON_TYPES.SMALL_ICON,
		title: t('videoCall.button.startVideoCall'),
		smallIconBackgroundColor: 'grey',
		icon: (
			<CameraOnIcon
				title={t('videoCall.button.startVideoCall')}
				aria-label={t('videoCall.button.startVideoCall')}
			/>
		)
	};

	const isActive = activeSession.item.active;
	const getSessionListTab = () =>
		`${sessionListTab ? `?sessionListTab=${sessionListTab}` : ''}`;
	const baseUrl = `${listPath}/:groupId/:id/:subRoute?/:extraPath?${getSessionListTab()}`;
	const groupChatInfoLink = generatePath(baseUrl, {
		...(activeSession.item as Omit<
			SessionItemInterface,
			'attachment' | 'topic' | 'e2eLastMessage' | 'videoCallMessageDTO'
		>),
		subRoute: 'groupChatInfo'
	});

	return (
		<div className="sessionInfo">
			<div className="sessionInfo__headerWrapper">
				<Link
					to={listPath + sessionTabPath}
					onClick={mobileListView}
					className="sessionInfo__backButton"
				>
					<BackIcon />
				</Link>
				<div className="sessionInfo__username sessionInfo__username--deactivate sessionInfo__username--groupChat">
					{hasUserAuthority(
						AUTHORITIES.CONSULTANT_DEFAULT,
						userData
					) ? (
						<Link
							to={`/sessions/consultant/${sessionView}/${activeSession.item.groupId}/${activeSession.item.id}/groupChatInfo${sessionTabPath}`}
						>
							<h3>{typeof activeSession.item.topic === 'string' ? activeSession.item.topic : activeSession.item.topic?.name || ''}</h3>
						</Link>
					) : (
						<h3>{typeof activeSession.item.topic === 'string' ? activeSession.item.topic : activeSession.item.topic?.name || ''}</h3>
					)}
				</div>

				{(!isActive || isJoinGroupChatView) && isConsultant && (
					<Link
						to={groupChatInfoLink}
						className="sessionMenu__item--desktop sessionMenu__button"
					>
						<span className="sessionMenu__icon">
							<GroupChatInfoIcon />
							{t('chatFlyout.groupChatInfo')}
						</span>
					</Link>
				)}

				{isActive &&
					!isJoinGroupChatView &&
					isConsultant && (
						<div
							className="sessionInfo__videoCallButtons"
							data-cy="session-header-video-call-buttons"
						>
							<Button
								buttonHandle={() => handleStartVideoCall(true)}
								item={buttonStartVideoCall}
							/>
							<Button
								buttonHandle={() => handleStartVideoCall(false)}
								item={buttonStartCall}
							/>
						</div>
					)}

				{/* MATRIX MIGRATION: Temporarily hide session menu for group chats */}
				{false && <SessionMenu
					hasUserInitiatedStopOrLeaveRequest={
						hasUserInitiatedStopOrLeaveRequest
					}
					isAskerInfoAvailable={isAskerInfoAvailable()}
					isJoinGroupChatView={isJoinGroupChatView}
					bannedUsers={bannedUsers}
				/>}
		</div>
		<div className="sessionInfo__metaInfo">
			{activeSession.item.active &&
				activeSession.item.subscribed &&
				!isJoinGroupChatView && (
						<div
							className="sessionInfo__metaInfo__content sessionInfo__metaInfo__content--clickable"
							id="subscriberButton"
							onClick={(e) => handleFlyout(e)}
						>
							{t('groupChat.active.sessionInfo.subscriber')}
							{isSubscriberFlyoutOpen && (
								<div className="sessionInfo__metaInfo__flyout">
									<ul>
										{users.map((subscriber, index) => (
											<li
												className={
													isCurrentUserModerator &&
													!bannedUsers.includes(
														subscriber.username
													) &&
													!moderators.includes(
														subscriber._id
													)
														? 'has-flyout'
														: ''
												}
												key={`subscriber-${subscriber._id}`}
												onClick={() => {
													if (
														!bannedUsers.includes(
															subscriber.username
														)
													) {
														setFlyoutOpenId(
															subscriber._id
														);
													}
												}}
											>
												<span>
													{decodeUsername(
														subscriber.displayName ||
															subscriber.username
													)}
												</span>
												{isCurrentUserModerator &&
													!moderators.includes(
														subscriber._id
													) && (
														<>
															<FlyoutMenu
																isHidden={bannedUsers.includes(
																	subscriber.username
																)}
																position={
																	window.innerWidth <=
																	520
																		? 'left'
																		: 'right'
																}
																isOpen={
																	flyoutOpenId ===
																	subscriber._id
																}
																handleClose={() =>
																	setFlyoutOpenId(
																		null
																	)
																}
															>
																<BanUser
																	userName={decodeUsername(
																		subscriber.username
																	)}
																	rcUserId={
																		subscriber._id
																	}
																	chatId={
																		activeSession
																			.item
																			.id
																	}
																	handleUserBan={() => {
																		setIsUserBanOverlayOpen(
																			true
																		);
																	}}
																/>
															</FlyoutMenu>{' '}
															<BanUserOverlay
																overlayActive={
																	isUserBanOverlayOpen
																}
																userName={decodeUsername(
																	subscriber.username
																)}
																handleOverlay={() => {
																	setIsUserBanOverlayOpen(
																		false
																	);
																}}
															></BanUserOverlay>
														</>
													)}
												{isCurrentUserModerator &&
													bannedUsers.includes(
														subscriber.username
													) && (
														<Tag
															className="bannedUserTag"
															color="red"
															text={t(
																'banUser.is.banned'
															)}
														/>
													)}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
			</div>
		</div>
	);
};
