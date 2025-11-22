
import React, { useState } from 'react';
import { X, ChevronRight, Shield, Globe, User, Bell, Info, Plus, Trash2, Smartphone, Key, Lock, Link, LogOut } from 'lucide-react';
import { UserProfile, Contact, Network } from '../types';
import { StorageService } from '../services/storageService';
import { DEFAULT_NETWORKS, TRANSLATIONS } from '../constants';

interface SettingsViewProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

type SettingsTab = 'main' | 'general' | 'security' | 'contacts' | 'networks' | 'dapps';

const SettingsView: React.FC<SettingsViewProps> = ({ user, onClose, onUpdateUser }) => {
  const [currentTab, setCurrentTab] = useState<SettingsTab>('main');
  const [networks, setNetworks] = useState<Network[]>(StorageService.getNetworks());

  // Network Form State
  const [newRpc, setNewRpc] = useState('');
  const [newChainId, setNewChainId] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');

  // Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');

  const t = TRANSLATIONS[user.language] || TRANSLATIONS.en;

  const handleAddNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    const network: Network = {
      id: 'custom-' + Date.now(),
      name: newName,
      rpcUrl: newRpc,
      chainId: newChainId,
      symbol: newSymbol,
      isTestnet: false,
      type: 'EVM'
    };
    const updated = StorageService.addNetwork(network);
    setNetworks(updated);
    setNewName(''); setNewRpc(''); setNewChainId(''); setNewSymbol('');
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactAddress) return;
    const contact: Contact = { id: Date.now().toString(), name: newContactName, address: newContactAddress };
    const updatedUser = { ...user, contacts: [...user.contacts, contact] };
    StorageService.saveUser(updatedUser);
    onUpdateUser(updatedUser);
    setNewContactName(''); setNewContactAddress('');
  };

  const handleDeleteContact = (id: string) => {
     const updatedUser = { ...user, contacts: user.contacts.filter(c => c.id !== id) };
     StorageService.saveUser(updatedUser);
     onUpdateUser(updatedUser);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updatedUser = { ...user, currency: e.target.value };
    StorageService.saveUser(updatedUser);
    onUpdateUser(updatedUser);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const newLang = e.target.value as 'en' | 'fr';
     const updatedUser = { ...user, language: newLang };
     StorageService.saveUser(updatedUser);
     onUpdateUser(updatedUser);
  };

  const MenuButton = ({ icon: Icon, title, subtitle, onClick, color = "text-slate-400" }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-2xl transition group mb-2">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center ${color} group-hover:scale-110 transition`}>
           <Icon size={20} />
        </div>
        <div className="text-left">
          <p className="font-bold text-white text-sm">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition" />
    </button>
  );

  const renderMain = () => (
    <div className="space-y-1">
      <MenuButton icon={Smartphone} title={t.settings.general} subtitle="Language, Currency" onClick={() => setCurrentTab('general')} color="text-blue-400"/>
      <MenuButton icon={Shield} title={t.settings.security} subtitle="Keys, Recovery" onClick={() => setCurrentTab('security')} color="text-emerald-400"/>
      <MenuButton icon={Globe} title={t.settings.networks} subtitle="RPC, Chains" onClick={() => setCurrentTab('networks')} color="text-purple-400"/>
      <MenuButton icon={User} title={t.settings.contacts} subtitle="Address Book" onClick={() => setCurrentTab('contacts')} color="text-amber-400"/>
      <MenuButton icon={Link} title={t.settings.dappConnections} subtitle="Permissions" onClick={() => setCurrentTab('dapps')} color="text-pink-400"/>
    </div>
  );

  const renderHeader = (title: string) => (
    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
      <button onClick={() => setCurrentTab('main')} className="p-1 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
        <ChevronRight size={24} className="rotate-180" />
      </button>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#0f172a] w-full max-w-lg h-[85vh] rounded-[2rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white">{t.menu.settings}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:rotate-90 transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-900 to-slate-950">
          {currentTab === 'main' && renderMain()}
          
          {currentTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-right-8 space-y-6">
               {renderHeader(t.settings.general)}
               
               <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                 <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">{t.settings.currency}</label>
                 <select 
                    value={user.currency} 
                    onChange={handleCurrencyChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 text-sm"
                 >
                   <option value="USD">USD - Dollar Américain ($)</option>
                   <option value="EUR">EUR - Euro (€)</option>
                   <option value="GBP">GBP - Livre Sterling (£)</option>
                   <option value="JPY">JPY - Yen Japonais (¥)</option>
                 </select>
               </div>

               <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                 <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">{t.settings.language}</label>
                 <select 
                    value={user.language} 
                    onChange={handleLanguageChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 text-sm"
                 >
                   <option value="fr">Français 🇫🇷</option>
                   <option value="en">English 🇺🇸</option>
                 </select>
               </div>
            </div>
          )}

          {currentTab === 'contacts' && (
             <div className="animate-in fade-in slide-in-from-right-8">
                {renderHeader(t.settings.contacts)}
                
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-6">
                   <h4 className="text-sm font-bold text-white mb-4">{t.settings.addContact}</h4>
                   <form onSubmit={handleAddContact} className="space-y-3">
                      <input 
                        value={newContactName} 
                        onChange={e => setNewContactName(e.target.value)}
                        placeholder="Nom"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                      />
                      <input 
                        value={newContactAddress} 
                        onChange={e => setNewContactAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                      />
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition flex items-center justify-center gap-2">
                        <Plus size={16} /> {t.settings.addContact}
                      </button>
                   </form>
                </div>

                <div className="space-y-2">
                  {user.contacts.length > 0 ? user.contacts.map(c => (
                    <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{c.address.slice(0,6)}...{c.address.slice(-4)}</p>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteContact(c.id)} className="text-slate-600 hover:text-rose-500 transition">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  )) : (
                    <p className="text-center text-slate-500 text-sm italic py-4">{t.settings.noContacts}</p>
                  )}
                </div>
             </div>
          )}

          {currentTab === 'networks' && (
             <div className="animate-in fade-in slide-in-from-right-8">
               {renderHeader(t.settings.networks)}
               <div className="mb-6 space-y-2">
                 {networks.map(net => (
                   <div key={net.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                     <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${net.isTestnet ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'} shadow-[0_0_5px]`}></div>
                       <div>
                         <p className="font-bold text-sm text-white">{net.name}</p>
                         <p className="text-[10px] text-slate-500 font-mono">{net.rpcUrl.slice(0, 25)}...</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               
               <button className="w-full border border-dashed border-slate-700 text-slate-400 p-3 rounded-xl text-sm font-medium hover:border-indigo-500 hover:text-indigo-400 transition">
                 + Ajouter RPC Personnalisé
               </button>
             </div>
          )}
          
          {currentTab === 'dapps' && (
             <div className="animate-in fade-in slide-in-from-right-8">
               {renderHeader(t.settings.dappConnections)}
               <div className="space-y-3">
                 <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <img src="https://uniswap.org/favicon.ico" className="w-6" alt=""/>
                       </div>
                       <div>
                         <p className="text-white font-bold text-sm">Uniswap Interface</p>
                         <p className="text-xs text-emerald-400">● Connecté</p>
                       </div>
                    </div>
                    <button className="text-xs text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition">
                       {t.settings.disconnect}
                    </button>
                 </div>
               </div>
             </div>
          )}

          {currentTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-right-8">
                 {renderHeader(t.settings.security)}
                 <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 mb-6 flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                      <Lock size={32} className="text-emerald-500" />
                   </div>
                   <h4 className="text-white font-bold mb-1">Sécurité Maximale</h4>
                   <p className="text-xs text-slate-400 mb-4">Vos clés sont chiffrées avec AES-256-GCM et ne quittent jamais cet appareil.</p>
                   <div className="w-full bg-slate-950 rounded-xl p-3 border border-slate-800 mb-4">
                     <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Wallet Actif</p>
                     <p className="text-xs text-white font-mono break-all">
                       {user.wallets.find(w => w.id === user.activeWalletId)?.address}
                     </p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <button className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold text-sm transition text-left flex items-center justify-between">
                     {t.settings.backupSeed}
                     <ChevronRight size={16} />
                   </button>
                   <button className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold text-sm transition text-left flex items-center justify-between">
                     {t.settings.viewPrivateKey}
                     <ChevronRight size={16} />
                   </button>
                 </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
