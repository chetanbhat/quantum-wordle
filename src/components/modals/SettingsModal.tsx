import { BaseModal } from './BaseModal'
import { SettingsToggle } from './SettingsToggle'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isDarkMode: boolean
  handleDarkMode: (value: boolean) => void
  isHighContrastMode: boolean
  handleHighContrastMode: (value: boolean) => void
  isBonusTurn: boolean
  handleBonusTurn: (value: boolean) => void
  isPracticeMode: boolean
  handlePracticeMode: (value: boolean) => void
}

export const SettingsModal = ({
  isOpen,
  handleClose,
  isDarkMode,
  handleDarkMode,
  isHighContrastMode,
  handleHighContrastMode,
  isBonusTurn,
  handleBonusTurn,
  isPracticeMode,
  handlePracticeMode,
}: Props) => {
  return (
    <BaseModal title="Settings" isOpen={isOpen} handleClose={handleClose}>
      <div className="grid-cols-2 gap-4">
        <SettingsToggle
          settingName="Dark Mode"
          flag={isDarkMode}
          handleFlag={handleDarkMode}
        />
        <SettingsToggle
          settingName="High Contrast Mode"
          flag={isHighContrastMode}
          handleFlag={handleHighContrastMode}
        />
        <SettingsToggle
          settingName="Bonus Turn"
          flag={isBonusTurn}
          handleFlag={handleBonusTurn}
        />
        <SettingsToggle
          settingName="Practice Mode"
          flag={isPracticeMode}
          handleFlag={handlePracticeMode}
        />
      </div>
    </BaseModal>
  )
}
