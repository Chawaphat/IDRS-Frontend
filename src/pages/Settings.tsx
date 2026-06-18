import React, { useState, useEffect } from 'react';
import { User, Building2, Sliders, Bell, LogOut, Shield, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { useToastStore } from '@/store/toastStore';
import { useConfirmStore } from '@/store/confirmStore';

export default function SettingsPage() {
  const { user, signOut } = useAuthStore();
  const { show: showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form State
  const [profileId, setProfileId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const email = user?.email || '';
  const [licenseId, setLicenseId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Trigger toasts on error/success state updates
  useEffect(() => {
    if (errorMsg) {
      showToast(errorMsg, 'error');
      setErrorMsg(null);
    }
  }, [errorMsg, showToast]);

  useEffect(() => {
    if (successMsg) {
      showToast(successMsg, 'success');
      setSuccessMsg(null);
    }
  }, [successMsg, showToast]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getMe();
        if (data) {
          setProfileId(data.id);
          setFullName(data.full_name || '');
          setLicenseId(data.license_id || '');
          setPhone(data.phone || '');
        }
      } catch (err: unknown) {
        console.error("Failed to fetch profile", err);
        setErrorMsg("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    
    try {
      if (!profileId) throw new Error("Profile ID not found.");
      
      await profileService.update(profileId, {
        full_name: fullName,
        license_id: licenseId,
        phone: phone,
      });
      
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      console.error("Failed to update profile", err);
      let errorMsgText = "Failed to save profile changes.";
      if (err && typeof err === 'object' && 'response' in err) {
        const responseErr = err as { response?: { data?: { detail?: string } } };
        errorMsgText = responseErr.response?.data?.detail || errorMsgText;
      } else if (err instanceof Error) {
        errorMsgText = err.message;
      }
      setErrorMsg(errorMsgText);
    } finally {
      setSaving(false);
    }
  };

  const askConfirm = useConfirmStore((state) => state.ask);

  const handleSignOut = () => {
    askConfirm({
      title: "Log Out",
      message: "Are you sure you want to log out of the system?",
      confirmText: "Log Out",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        try {
          await signOut();
        } catch (err: unknown) {
          showToast("Network connection error. Cannot log out at this time.", 'error');
        }
      }
    });
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'clinic', label: 'Clinic Details', icon: Building2 },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col h-full space-y-8 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
          
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xl font-bold text-slate-900">My Profile</h3>
                <p className="text-sm text-slate-500">Update your personal information and public profile.</p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-teal-500/20">
                      {fullName ? fullName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'D')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</label>
                      <input 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Address</label>
                      <input 
                        value={email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none text-sm font-medium" 
                      />
                      <p className="text-[10px] text-slate-400">Email cannot be changed directly.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">License Number</label>
                      <input 
                        value={licenseId}
                        onChange={(e) => setLicenseId(e.target.value)}
                        placeholder="e.g. DENT-2023-4451"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone Number</label>
                      <input 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 081-234-5678"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="h-11 px-8 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Other tabs placeholder */}
          {['clinic', 'preferences', 'notifications', 'security', 'billing'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-64 animate-in fade-in duration-300 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Sliders className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 capitalize">
                {activeTab === 'clinic' ? 'Clinic Details' : activeTab}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">This section is currently under construction. Stay tuned!</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
