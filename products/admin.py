import json
import io
from datetime import datetime

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.db.models import Count, Sum
from django.http import HttpResponse, FileResponse
from django.urls import path
from django.shortcuts import redirect
from django.utils.safestring import mark_safe

from .models import Product, UserProfile, Order, NewItem, EditableContent


# ══════════════════════════════════════════════════
#  PDF HELPER
# ══════════════════════════════════════════════════

def generate_orders_pdf(orders):
    """Generate PDF for orders using reportlab"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Table, TableStyle, Paragraph,
            Spacer, HRFlowable
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        import os

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            rightMargin=1.5*cm, leftMargin=1.5*cm,
            topMargin=2*cm, bottomMargin=2*cm
        )

        # Try to register a font with Cyrillic support
        font_name = 'Helvetica'
        try:
            font_paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
                '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
            ]
            for fp in font_paths:
                if os.path.exists(fp):
                    pdfmetrics.registerFont(TTFont('CyrFont', fp))
                    font_name = 'CyrFont'
                    break
        except Exception:
            pass

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'Title', fontName=font_name, fontSize=18,
            alignment=TA_CENTER, spaceAfter=6, textColor=colors.HexColor('#dc2626')
        )
        subtitle_style = ParagraphStyle(
            'Sub', fontName=font_name, fontSize=10,
            alignment=TA_CENTER, spaceAfter=12, textColor=colors.grey
        )
        normal_style = ParagraphStyle(
            'Normal2', fontName=font_name, fontSize=9
        )

        story = []

        # Header
        story.append(Paragraph("🍓 Chocoberry — Отчёт по заказам", title_style))
        story.append(Paragraph(
            f"Дата формирования: {datetime.now().strftime('%d.%m.%Y %H:%M')}  |  Всего заказов: {orders.count()}",
            subtitle_style
        ))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#dc2626')))
        story.append(Spacer(1, 0.4*cm))

        # Summary stats
        total_sum = orders.aggregate(total=Sum('total_price'))['total'] or 0
        completed = orders.filter(status='completed').count()
        pending = orders.filter(status='pending').count()

        summary_data = [
            ['Всего заказов', 'Завершено', 'В ожидании', 'Общая сумма'],
            [str(orders.count()), str(completed), str(pending), f"{total_sum:.0f} сомони"],
        ]
        summary_table = Table(summary_data, colWidths=[4*cm, 4*cm, 4*cm, 5*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#dc2626')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,-1), font_name),
            ('FONTSIZE', (0,0), (-1,0), 10),
            ('FONTSIZE', (0,1), (-1,1), 12),
            ('FONTNAME', (0,1), (-1,1), font_name),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#fff1f2'), colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fecaca')),
            ('ROUNDEDCORNERS', [4,4,4,4]),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.5*cm))

        # Orders table header
        story.append(Paragraph("Список заказов:", ParagraphStyle('h2', fontName=font_name, fontSize=12, spaceAfter=6, textColor=colors.HexColor('#1f2937'))))

        STATUS_MAP = {
            'pending': 'Ожидает',
            'confirmed': 'Подтверждён',
            'preparing': 'Готовится',
            'delivering': 'Доставляется',
            'completed': 'Завершён',
            'cancelled': 'Отменён',
        }

        table_data = [['#', 'Клиент', 'Телефон', 'Товары', 'Сумма', 'Статус', 'Дата']]

        for order in orders:
            try:
                items = order.items if isinstance(order.items, list) else json.loads(order.items)
                items_text = ', '.join([
                    f"{i.get('name','?')} x{i.get('quantity',1)}"
                    for i in items[:3]
                ])
                if len(items) > 3:
                    items_text += f' (+{len(items)-3})'
            except Exception:
                items_text = str(order.items)[:40]

            table_data.append([
                str(order.id),
                order.user_profile.name if order.user_profile else '—',
                order.user_profile.phone if order.user_profile else '—',
                Paragraph(items_text, ParagraphStyle('cell', fontName=font_name, fontSize=7)),
                f"{order.total_price:.0f} с.",
                STATUS_MAP.get(order.status, order.status),
                order.created_at.strftime('%d.%m.%Y\n%H:%M'),
            ])

        col_widths = [1*cm, 3.5*cm, 3*cm, 5*cm, 2*cm, 2.5*cm, 2.5*cm]
        orders_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        orders_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,-1), font_name),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('FONTSIZE', (0,1), (-1,-1), 7),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fef2f2')]),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(orders_table)

        # Footer
        story.append(Spacer(1, 0.8*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#fecaca')))
        story.append(Paragraph(
            f"© Chocoberry — chocoberry.tj  |  +992 501 07 77 03",
            ParagraphStyle('footer', fontName=font_name, fontSize=8,
                           alignment=TA_CENTER, textColor=colors.grey)
        ))

        doc.build(story)
        buf.seek(0)
        return buf

    except ImportError:
        return None


# ══════════════════════════════════════════════════
#  PRODUCT ADMIN
# ══════════════════════════════════════════════════

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'image_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {'fields': ('name', 'description', 'price')}),
        ('Изображение', {'fields': ('image', 'image_preview')}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:100px;max-width:100px;border-radius:4px;" />',
                obj.image.url
            )
        return "Нет изображения"
    image_preview.short_description = "Превью"


# ══════════════════════════════════════════════════
#  ORDER ADMIN  (with PDF export)
# ══════════════════════════════════════════════════

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'client_name', 'client_phone', 'items_preview',
                    'total_price', 'status_badge', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user_profile__name', 'user_profile__phone']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'telegram_message_id', 'items_detail']
    actions = ['export_selected_pdf', 'mark_completed', 'mark_cancelled']

    fieldsets = (
        ('Информация о заказе', {'fields': ('user_profile', 'items_detail', 'total_price', 'status')}),
        ('Telegram', {'fields': ('telegram_message_id',)}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    # ── Custom columns ──────────────────────────────
    def client_name(self, obj):
        return obj.user_profile.name if obj.user_profile else '—'
    client_name.short_description = 'Клиент'

    def client_phone(self, obj):
        if obj.user_profile and obj.user_profile.phone:
            return format_html('<a href="tel:{}">{}</a>', obj.user_profile.phone, obj.user_profile.phone)
        return '—'
    client_phone.short_description = 'Телефон'

    def items_preview(self, obj):
        try:
            items = obj.items if isinstance(obj.items, list) else json.loads(obj.items)
            text = ', '.join([f"{i.get('name','?')} ×{i.get('quantity',1)}" for i in items[:2]])
            if len(items) > 2:
                text += f' (+{len(items)-2})'
            return text
        except Exception:
            return str(obj.items)[:50]
    items_preview.short_description = 'Товары'

    def items_detail(self, obj):
        try:
            items = obj.items if isinstance(obj.items, list) else json.loads(obj.items)
            rows = ''.join([
                f'<tr><td style="padding:4px 8px;">{i.get("name","?")}</td>'
                f'<td style="padding:4px 8px;text-align:center;">{i.get("quantity",1)}</td>'
                f'<td style="padding:4px 8px;text-align:right;">{i.get("price","—")} с.</td></tr>'
                for i in items
            ])
            return format_html(
                '<table style="border-collapse:collapse;width:100%;max-width:500px;">'
                '<thead><tr style="background:#dc2626;color:white;">'
                '<th style="padding:6px 8px;">Товар</th>'
                '<th style="padding:6px 8px;">Кол-во</th>'
                '<th style="padding:6px 8px;">Цена</th>'
                '</tr></thead><tbody>{}</tbody></table>',
                mark_safe(rows)
            )
        except Exception:
            return str(obj.items)
    items_detail.short_description = 'Состав заказа'

    def status_badge(self, obj):
        colors_map = {
            'pending':    ('#f59e0b', 'Ожидает'),
            'confirmed':  ('#3b82f6', 'Подтверждён'),
            'preparing':  ('#8b5cf6', 'Готовится'),
            'delivering': ('#06b6d4', 'Доставляется'),
            'completed':  ('#22c55e', 'Завершён'),
            'cancelled':  ('#ef4444', 'Отменён'),
        }
        color, label = colors_map.get(obj.status, ('#6b7280', obj.status))
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            color, label
        )
    status_badge.short_description = 'Статус'

    # ── Actions ─────────────────────────────────────
    def export_selected_pdf(self, request, queryset):
        buf = generate_orders_pdf(queryset)
        if buf is None:
            self.message_user(request, "❌ reportlab не установлен. Запустите: pip install reportlab", level='error')
            return
        filename = f"chocoberry_orders_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        response = HttpResponse(buf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    export_selected_pdf.short_description = "📄 Скачать PDF (выбранные)"

    def mark_completed(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f"✅ {updated} заказ(ов) завершено")
    mark_completed.short_description = "✅ Отметить как завершённые"

    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f"❌ {updated} заказ(ов) отменено")
    mark_cancelled.short_description = "❌ Отменить заказы"

    # ── Custom URL for export ALL orders PDF ────────
    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('export-all-pdf/', self.admin_site.admin_view(self.export_all_pdf), name='orders_export_all_pdf'),
        ]
        return custom + urls

    def export_all_pdf(self, request):
        queryset = Order.objects.all().order_by('-created_at')
        buf = generate_orders_pdf(queryset)
        if buf is None:
            self.message_user(request, "❌ reportlab не установлен!", level='error')
            return redirect('..')
        filename = f"chocoberry_all_orders_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        response = HttpResponse(buf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    # ── Add export button to changelist ─────────────
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['export_all_pdf_url'] = 'export-all-pdf/'
        extra_context['orders_total'] = Order.objects.count()
        extra_context['orders_sum'] = Order.objects.aggregate(s=Sum('total_price'))['s'] or 0
        extra_context['orders_pending'] = Order.objects.filter(status='pending').count()
        extra_context['orders_completed'] = Order.objects.filter(status='completed').count()
        return super().changelist_view(request, extra_context=extra_context)

    class Media:
        css = {'all': ('admin/css/order_admin.css',)}


# ══════════════════════════════════════════════════
#  NEW ITEM ADMIN
# ══════════════════════════════════════════════════

@admin.register(NewItem)
class NewItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'order', 'is_active', 'background_image_preview', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['order', '-created_at']
    readonly_fields = ['background_image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {'fields': ('title', 'description', 'order', 'is_active')}),
        ('Изображение', {'fields': ('background_image', 'background_image_preview')}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def background_image_preview(self, obj):
        if obj.background_image:
            return format_html(
                '<img src="{}" style="max-height:150px;max-width:200px;border-radius:8px;object-fit:cover;" />',
                obj.background_image.url
            )
        return "Нет изображения"
    background_image_preview.short_description = "Превью"


# ══════════════════════════════════════════════════
#  EDITABLE CONTENT ADMIN
# ══════════════════════════════════════════════════

@admin.register(EditableContent)
class EditableContentAdmin(admin.ModelAdmin):
    list_display = ['id', 'key', 'page', 'content_preview', 'updated_at']
    list_filter = ['page', 'updated_at']
    search_fields = ['key', 'content', 'page']
    ordering = ['page', 'key']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['page']
    fieldsets = (
        ('Основная информация', {'fields': ('key', 'page', 'content')}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def content_preview(self, obj):
        return (obj.content[:80] + '…') if len(obj.content) > 80 else obj.content
    content_preview.short_description = "Превью"

    actions = ['duplicate_content']

    def duplicate_content(self, request, queryset):
        for c in queryset:
            EditableContent.objects.create(key=f"{c.key}_copy", content=c.content, page=c.page)
        self.message_user(request, f"Дублировано {queryset.count()} элементов")
    duplicate_content.short_description = "Дублировать выбранные"


# ══════════════════════════════════════════════════
#  USER ADMIN  (full info + stats)
# ══════════════════════════════════════════════════

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Профиль'
    fk_name = 'user'
    readonly_fields = ['photo_preview', 'orders_count', 'orders_sum', 'created_at', 'updated_at']
    fields = ['name', 'phone', 'address', 'photo', 'photo_preview',
              'orders_count', 'orders_sum', 'created_at']

    def photo_preview(self, obj):
        if obj.photo:
            return format_html(
                '<img src="{}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;" />',
                obj.photo.url
            )
        return "—"
    photo_preview.short_description = "Фото"

    def orders_count(self, obj):
        count = obj.orders.count()
        return format_html('<strong style="color:#dc2626;font-size:16px;">{}</strong> заказов', count)
    orders_count.short_description = "Заказов"

    def orders_sum(self, obj):
        total = obj.orders.aggregate(s=Sum('total_price'))['s'] or 0
        return format_html('<strong style="color:#16a34a;font-size:16px;">{:.0f}</strong> сомони', total)
    orders_sum.short_description = "Потрачено"


class CustomUserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = [
        'username', 'email', 'full_name', 'profile_phone',
        'profile_address', 'orders_count', 'orders_sum',
        'is_staff', 'is_superuser', 'is_active', 'date_joined'
    ]
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name',
                     'profile__name', 'profile__phone']
    ordering = ['-date_joined']
    actions = ['export_users_pdf']

    def full_name(self, obj):
        try:
            return obj.profile.name or f"{obj.first_name} {obj.last_name}".strip() or '—'
        except Exception:
            return f"{obj.first_name} {obj.last_name}".strip() or '—'
    full_name.short_description = 'Имя'

    def profile_phone(self, obj):
        try:
            phone = obj.profile.phone
            if phone:
                return format_html('<a href="tel:{}">{}</a>', phone, phone)
        except Exception:
            pass
        return '—'
    profile_phone.short_description = 'Телефон'

    def profile_address(self, obj):
        try:
            addr = obj.profile.address
            return (addr[:40] + '…') if addr and len(addr) > 40 else (addr or '—')
        except Exception:
            return '—'
    profile_address.short_description = 'Адрес'

    def orders_count(self, obj):
        try:
            count = obj.profile.orders.count()
            color = '#dc2626' if count > 0 else '#6b7280'
            return format_html(
                '<span style="background:{};color:white;padding:2px 8px;'
                'border-radius:10px;font-weight:600;">{}</span>',
                color, count
            )
        except Exception:
            return format_html('<span style="color:#6b7280;">0</span>')
    orders_count.short_description = '📦 Заказов'

    def orders_sum(self, obj):
        try:
            total = obj.profile.orders.aggregate(s=Sum('total_price'))['s'] or 0
            if total > 0:
                return format_html(
                    '<strong style="color:#16a34a;">{:.0f} с.</strong>', total
                )
            return '—'
        except Exception:
            return '—'
    orders_sum.short_description = '💰 Сумма'

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)

    # ── Export users to PDF ──────────────────────────
    def export_users_pdf(self, request, queryset):
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.lib.units import cm
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
            from reportlab.lib.styles import ParagraphStyle
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            from reportlab.lib.enums import TA_CENTER
            import os

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=A4,
                                    rightMargin=1.5*cm, leftMargin=1.5*cm,
                                    topMargin=2*cm, bottomMargin=2*cm)

            font_name = 'Helvetica'
            try:
                for fp in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                           '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf']:
                    if os.path.exists(fp):
                        pdfmetrics.registerFont(TTFont('CyrFont2', fp))
                        font_name = 'CyrFont2'
                        break
            except Exception:
                pass

            story = []
            story.append(Paragraph("🍓 Chocoberry — Список пользователей",
                ParagraphStyle('T', fontName=font_name, fontSize=16, alignment=TA_CENTER,
                               textColor=colors.HexColor('#dc2626'), spaceAfter=4)))
            story.append(Paragraph(
                f"Дата: {datetime.now().strftime('%d.%m.%Y %H:%M')}  |  Всего: {queryset.count()}",
                ParagraphStyle('S', fontName=font_name, fontSize=9, alignment=TA_CENTER,
                               textColor=colors.grey, spaceAfter=10)))
            story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#dc2626')))
            story.append(Spacer(1, 0.3*cm))

            table_data = [['#', 'Логин', 'Имя', 'Телефон', 'Email', 'Адрес', 'Заказов', 'Сумма', 'Дата рег.']]
            for u in queryset:
                try:
                    p = u.profile
                    name = p.name or f"{u.first_name} {u.last_name}".strip() or '—'
                    phone = p.phone or '—'
                    address = (p.address[:25] + '…') if p.address and len(p.address) > 25 else (p.address or '—')
                    order_count = p.orders.count()
                    order_sum = p.orders.aggregate(s=Sum('total_price'))['s'] or 0
                except Exception:
                    name, phone, address, order_count, order_sum = '—', '—', '—', 0, 0

                table_data.append([
                    str(u.id), u.username, name, phone,
                    u.email or '—', address,
                    str(order_count), f"{order_sum:.0f} с.",
                    u.date_joined.strftime('%d.%m.%Y'),
                ])

            col_w = [0.8*cm, 2.5*cm, 3*cm, 2.8*cm, 3.5*cm, 3*cm, 1.5*cm, 2*cm, 2*cm]
            t = Table(table_data, colWidths=col_w, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,-1), font_name),
                ('FONTSIZE', (0,0), (-1,0), 7),
                ('FONTSIZE', (0,1), (-1,-1), 6.5),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fef2f2')]),
                ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e5e7eb')),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(t)

            doc.build(story)
            buf.seek(0)
            fname = f"chocoberry_users_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
            response = HttpResponse(buf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{fname}"'
            return response

        except ImportError:
            self.message_user(request, "❌ reportlab не установлен!", level='error')
    export_users_pdf.short_description = "📄 Скачать PDF (пользователи)"


# Перерегистрируем UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# ══════════════════════════════════════════════════
#  USER PROFILE ADMIN
# ══════════════════════════════════════════════════

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'photo_preview', 'name', 'phone', 'address_short',
                    'user_link', 'orders_count', 'orders_sum', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'phone', 'address', 'user__username', 'user__email']
    ordering = ['-created_at']
    readonly_fields = ['photo_preview', 'orders_list', 'orders_count',
                       'orders_sum', 'created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {'fields': ('user', 'name', 'phone', 'address')}),
        ('Фото', {'fields': ('photo', 'photo_preview')}),
        ('Заказы', {'fields': ('orders_count', 'orders_sum', 'orders_list')}),
        ('Метаданные', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def photo_preview(self, obj):
        if obj.photo:
            return format_html(
                '<img src="{}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;" />',
                obj.photo.url
            )
        return "—"
    photo_preview.short_description = "Фото"

    def address_short(self, obj):
        if obj.address:
            return (obj.address[:35] + '…') if len(obj.address) > 35 else obj.address
        return '—'
    address_short.short_description = 'Адрес'

    def user_link(self, obj):
        if obj.user:
            return format_html(
                '<a href="/admin/auth/user/{}/change/">👤 {}</a>',
                obj.user.id, obj.user.username
            )
        return '—'
    user_link.short_description = 'Аккаунт'

    def orders_count(self, obj):
        count = obj.orders.count()
        color = '#dc2626' if count > 0 else '#6b7280'
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;'
            'border-radius:12px;font-weight:700;">{}</span>',
            color, count
        )
    orders_count.short_description = '📦 Заказов'

    def orders_sum(self, obj):
        total = obj.orders.aggregate(s=Sum('total_price'))['s'] or 0
        if total > 0:
            return format_html('<strong style="color:#16a34a;font-size:14px;">{:.0f} сомони</strong>', total)
        return '—'
    orders_sum.short_description = '💰 Итого'

    def orders_list(self, obj):
        orders = obj.orders.order_by('-created_at')[:10]
        if not orders:
            return 'Заказов нет'
        STATUS_MAP = {
            'pending': ('#f59e0b', 'Ожидает'),
            'confirmed': ('#3b82f6', 'Подтверждён'),
            'preparing': ('#8b5cf6', 'Готовится'),
            'delivering': ('#06b6d4', 'Доставляется'),
            'completed': ('#22c55e', 'Завершён'),
            'cancelled': ('#ef4444', 'Отменён'),
        }
        rows = ''
        for o in orders:
            color, label = STATUS_MAP.get(o.status, ('#6b7280', o.status))
            rows += (
                f'<tr>'
                f'<td style="padding:5px 8px;"><a href="/admin/products/order/{o.id}/change/">#{o.id}</a></td>'
                f'<td style="padding:5px 8px;">{o.created_at.strftime("%d.%m.%Y %H:%M")}</td>'
                f'<td style="padding:5px 8px;font-weight:700;">{o.total_price:.0f} с.</td>'
                f'<td style="padding:5px 8px;"><span style="background:{color};color:white;'
                f'padding:2px 8px;border-radius:10px;font-size:11px;">{label}</span></td>'
                f'</tr>'
            )
        return format_html(
            '<table style="border-collapse:collapse;width:100%;">'
            '<thead><tr style="background:#1f2937;color:white;">'
            '<th style="padding:6px 8px;">№</th>'
            '<th style="padding:6px 8px;">Дата</th>'
            '<th style="padding:6px 8px;">Сумма</th>'
            '<th style="padding:6px 8px;">Статус</th>'
            '</tr></thead><tbody>{}</tbody></table>',
            mark_safe(rows)
        )
    orders_list.short_description = 'История заказов'
