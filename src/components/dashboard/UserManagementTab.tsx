/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';
import {
  Users,
  ShieldCheck,
  Check,
  X,
  Ban,
  Clock,
  Mail,
  Phone,
  Lock,
  Crown,
  UserCheck,
  UserX,
  Shield,
  UserCog,
  ArrowRight,
} from 'lucide-react';

export const UserManagementTab: React.FC = () => {
  const {
    users,
    currentUser,
    approveUser,
    rejectUser,
    toggleUserBan,
    updateUserRole,
    canManageUsers,
  } = useStore();

  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  if (!canManageUsers) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-8 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Administrator Access Required
        </h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Customer approval queue and user management are strictly restricted to the <strong>Admin</strong> tier.
        </p>
      </div>
    );
  }

  const staffUsers = users.filter(u => u.role === 'admin' || u.role === 'moderator');
  const customerUsers = users.filter(u => u.role === 'customer');

  const pendingCustomers = customerUsers.filter(u => u.approvalStatus === 'pending' || !u.approvalStatus);
  const approvedCustomers = customerUsers.filter(u => u.approvalStatus === 'approved');
  const rejectedCustomers = customerUsers.filter(u => u.approvalStatus === 'rejected');

  const displayedCustomers = customerUsers.filter(u => {
    if (filterTab === 'pending') return u.approvalStatus === 'pending' || !u.approvalStatus;
    if (filterTab === 'approved') return u.approvalStatus === 'approved';
    if (filterTab === 'rejected') return u.approvalStatus === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* XEEROO User & Staff Access Governance Header */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight">XEEROO User & Role Management</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Manage customer accounts, approve new buyer registrations, and assign roles. As an Administrator, you can promote any customer to <strong>Moderator</strong> or <strong>Admin</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 font-mono text-blue-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Staff Members: <strong>{staffUsers.length}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 font-mono text-amber-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Pending Approvals: <strong>{pendingCustomers.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Staff & Team (Admins & Moderators) Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Staff & Management Team ({staffUsers.length})
            </h4>
          </div>
          <span className="text-[11px] text-gray-500">
            Admins have full access; Moderators can edit products & inventory
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {staffUsers.map(member => (
            <div
              key={member.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    member.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
                  }
                  alt={member.fullName}
                  className={`w-10 h-10 rounded-full object-cover ring-2 ${
                    member.role === 'admin' ? 'ring-purple-600' : 'ring-blue-600'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-xs">{member.fullName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {member.role}
                    </span>
                    {member.id === currentUser?.id && (
                      <span className="text-[10px] text-gray-400 font-mono">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-cyan-600" />
                      {member.email}
                    </span>
                    {member.phone && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {member.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Change Control for Staff */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium">Role:</span>
                  <select
                    value={member.role}
                    disabled={member.id === currentUser?.id && member.role === 'admin'}
                    onChange={e => updateUserRole(member.id, e.target.value as UserRole)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold font-mono focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="customer">Demote to Customer</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Registration Approval Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Customer Accounts & Approval Queue ({customerUsers.length})</span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Review registrations, grant checkout authorization, or promote customers to Moderator/Admin
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All ({customerUsers.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterTab === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Pending ({pendingCustomers.length})
            </button>
            <button
              onClick={() => setFilterTab('approved')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterTab === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Approved ({approvedCustomers.length})
            </button>
            <button
              onClick={() => setFilterTab('rejected')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterTab === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Rejected ({rejectedCustomers.length})
            </button>
          </div>
        </div>

        {displayedCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No customers found in this approval filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer Details</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Approval Status</th>
                  <th className="py-3 px-4 font-semibold">Role Promotion</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedCustomers.map(customer => {
                  const status = customer.approvalStatus || 'pending';

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              customer.avatarUrl ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                            }
                            alt={customer.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {customer.fullName}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400">
                              ID: {customer.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="text-gray-900 font-mono font-medium flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-blue-500" />
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="text-gray-600 font-mono text-[11px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-500" />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <UserX className="w-3.5 h-3.5 text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Role Promotion */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserCog className="w-3.5 h-3.5 text-blue-600" />
                          <select
                            value={customer.role}
                            onChange={e => updateUserRole(customer.id, e.target.value as UserRole)}
                            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                            title="Change User Role"
                          >
                            <option value="customer">Customer</option>
                            <option value="moderator">Promote to Moderator</option>
                            <option value="admin">Promote to Admin</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'approved' && (
                            <button
                              onClick={() => approveUser(customer.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                              title="Approve Customer Registration"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {status !== 'rejected' && (
                            <button
                              onClick={() => rejectUser(customer.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Reject Customer Account"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            onClick={() => toggleUserBan(customer.id)}
                            className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                              customer.isBanned
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                            title={customer.isBanned ? 'Unban customer' : 'Ban customer'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
